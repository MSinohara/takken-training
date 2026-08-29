const GAS_WEB_APP_URL =
  location.hostname === "tokyo-takken-10block.web.app" ||
  location.hostname === "tokyo-takken-10block.firebaseapp.com"
    ? "https://script.google.com/macros/s/AKfycbytZZvMaBdbLd4XxSY4Im0Qc86UCSNbcKbyF4qAm5Vl0tb1_12gBnwoe7qLrLADHbRwLQ/exec"
    : "https://script.google.com/macros/s/AKfycbz89atrbyCIjnYNBMR8hhACapdhBbhuqNphHX6dlmmCsjrKg0YcZjdvRUghkH6cFIZx/exec";

const AUTH_SESSION_STORAGE_KEY =
  "takkenTrainingSessionToken";

const DEFAULT_JSONP_TIMEOUT_MS =
  90000;

const READ_JSONP_TIMEOUT_MS =
  90000;

const WRITE_JSONP_TIMEOUT_MS =
  120000;

const AUTH_USER_STORAGE_KEY =
  "takkenTrainingAuthUser";

const AUTH_PUBLIC_PAGES =
  {
    "login.html": true,
    "self-checkin.html": true,
    "guest-checkin.html": true,
    "poster.html": true,
    "reset-poster.html": true,
    "member-register.html": true,
    "location-checkin.html": true,
    "attendance-answer.html": true,
    "demo-mail.html": true,
    "training-mail-preview.html": true,
    "personal-member-qr.html": true
  };

const AUTH_PAGE_ROLES =
  {
    "index.html": ["admin", "staff", "reception"],
    "training-menu.html": ["admin", "staff", "reception"],
    "member-org-menu.html": ["admin", "staff"],
    "settings.html": ["admin", "staff"],
    "auth-user-setting.html": ["admin"],
    "member-import.html": ["admin"],
    "organization-member-import.html": ["admin"],
    "organization-setting.html": ["admin"],
    "personal-member-master.html": ["admin", "staff"],
    "personal-member-qr-bulk.html": ["admin", "staff"],
    "member-list.html": ["admin", "staff"],
    "member-detail.html": ["admin", "staff"],
    "training-list.html": ["admin", "staff"],
    "training-form.html": ["admin", "staff"],
    "training-detail.html": ["admin", "staff", "reception"],
    "training-record.html": ["admin", "staff"],
    "training-record-edit.html": ["admin", "staff"],
    "venue-master.html": ["admin", "staff"],
    "venue-history.html": ["admin", "staff"],
    "mail-select.html": ["admin", "staff"],
    "mail-send.html": ["admin", "staff"],
    "mail-history.html": ["admin", "staff"],
    "mail-signature-setting.html": ["admin", "staff"],
    "mail-sender-setting.html": ["admin", "staff"],
    "attendance-setting.html": ["admin", "staff"],
    "attendance-responses.html": ["admin", "staff"],
    "attendance-print.html": ["admin", "staff"],
    "system-check.html": ["admin"],
    "checkin-load-test.html": ["admin"],
    "event-type-setting.html": ["admin", "staff"],
    "checkin-select.html": ["admin", "staff", "reception"],
    "checkin.html": ["admin", "staff", "reception"],
    "staff-checkin.html": ["admin", "staff", "reception"],
    "staff-qr-checkin.html": ["admin", "staff", "reception"],
    "live-checkin.html": ["admin", "staff", "reception"],
    "checkin-manage.html": ["admin", "staff", "reception"],
    "history.html": ["admin", "staff", "reception"],
    "stats.html": ["admin", "staff", "reception"],
    "individual-stats.html": ["admin", "staff", "reception"],
    "annual-stats.html": ["admin", "staff", "reception"],
    "follow-analysis.html": ["admin", "staff"],
    "certificate-menu.html": ["admin", "staff"],
    "certificate.html": ["admin", "staff"],
    "certificate-history.html": ["admin", "staff"],
    "certificate-issuer-setting.html": ["admin", "staff"],
    "certificate-rule-setting.html": ["admin", "staff"],
    "certificate-rule-summary.html": ["admin", "staff"],
    "member-qr.html": ["admin", "staff"],
    "member-qr-bulk.html": ["admin", "staff"]
  };

let currentAuthState_ =
  {
    loaded: false,
    enabled: false,
    user: null
  };

let lastClickedSaveButton_ =
  null;

document.addEventListener("click", function(event){

  const button =
    event.target && event.target.closest
      ? event.target.closest("button")
      : null;

  if(!button){
    return;
  }

  const text =
    String(button.textContent || "").trim();

  if(
    text.indexOf("保存") !== -1 ||
    text === "登録する" ||
    text === "登録"
  ){
    lastClickedSaveButton_ =
      button;
  }
}, true);

function jsonp(action, params, callback, timeoutMs, retryCount){

  retryCount =
    retryCount || 0;

  const effectiveTimeoutMs =
    getJsonpTimeoutMs_(
      action,
      timeoutMs
    );

  const saveFeedback =
    beginSaveFeedback_(action);

  const callbackName =
    "jsonp_" +
    Date.now() +
    "_" +
    Math.floor(Math.random() * 10000);

  let completed =
    false;

  let script =
    null;

  window[callbackName] = function(res){

    completed =
      true;

    if(handleAuthFailure_(res)){
      finishSaveFeedback_(
        saveFeedback,
        false,
        res && res.message ? res.message : "保存できませんでした。"
      );

      delete window[callbackName];

      if(script && script.parentNode){
        script.parentNode.removeChild(script);
      }

      return;
    }

    callback(res);

    finishSaveFeedback_(
      saveFeedback,
      res && res.ok,
      res && res.message
    );

    delete window[callbackName];

    if(script && script.parentNode){
      script.parentNode.removeChild(script);
    }
  };

  let url =
    GAS_WEB_APP_URL +
    "?action=" +
    encodeURIComponent(action) +
    "&callback=" +
    callbackName;

  const sendParams =
    Object.assign({}, params || {});

  const sessionToken =
    getAuthSessionToken_();

  if(sessionToken && !sendParams.sessionToken){
    sendParams.sessionToken =
      sessionToken;
  }

  Object.keys(sendParams).forEach(function(key){
    url +=
      "&" +
      encodeURIComponent(key) +
      "=" +
      encodeURIComponent(sendParams[key]);
  });

  script =
    document.createElement("script");

  script.src =
    url;

  script.onerror = function(){

    if(completed){
      return;
    }

    completed =
      true;

    delete window[callbackName];

    if(
      shouldRetryJsonp_(action, retryCount)
    ){
      cleanupJsonpCallback_(
        callbackName,
        script
      );

      setTimeout(function(){
        jsonp(
          action,
          params,
          callback,
          timeoutMs,
          retryCount + 1
        );
      }, 1200);
      return;
    }

    const errorRes = {
      ok: false,
      message: makeJsonpCommunicationErrorMessage_(action)
    };

    callback(errorRes);

    finishSaveFeedback_(
      saveFeedback,
      false,
      errorRes.message
    );

    if(script && script.parentNode){
      script.parentNode.removeChild(script);
    }
  };

  setTimeout(function(){

    if(completed){
      return;
    }

    completed =
      true;

    cleanupJsonpCallback_(
      callbackName,
      script
    );

    if(
      shouldRetryJsonp_(action, retryCount)
    ){
      setTimeout(function(){
        jsonp(
          action,
          params,
          callback,
          timeoutMs,
          retryCount + 1
        );
      }, 1200);
      return;
    }

    const timeoutRes = {
      ok: false,
      message: makeJsonpTimeoutMessage_(action)
    };

    callback(timeoutRes);

    finishSaveFeedback_(
      saveFeedback,
      false,
      timeoutRes.message
    );

  }, effectiveTimeoutMs);

  document.body.appendChild(script);
}

function getJsonpTimeoutMs_(action, timeoutMs){

  const requested =
    Number(timeoutMs || 0);

  if(isMutationAction_(action)){
    return Math.max(
      requested || WRITE_JSONP_TIMEOUT_MS,
      WRITE_JSONP_TIMEOUT_MS
    );
  }

  return Math.max(
    requested || READ_JSONP_TIMEOUT_MS,
    READ_JSONP_TIMEOUT_MS
  );
}

function shouldRetryJsonp_(action, retryCount){

  return !isMutationAction_(action) &&
    retryCount < 1;
}

function isMutationAction_(action){

  const text =
    String(action || "");

  return /^(save|register|update|delete|send|resend|create|start|queue|append|finish|import|backup|build|reset|checkin|sync|replace|deactivate)/i.test(
    text
  );
}

function makeJsonpCommunicationErrorMessage_(action){

  if(isMutationAction_(action)){
    return "通信に失敗しました。保存・登録済みの可能性があります。画面を再読み込みして反映状況を確認してから、必要な場合だけ再操作してください。";
  }

  return "通信に失敗しました。画面を再読み込みするか、時間をおいて再度お試しください。";
}

function makeJsonpTimeoutMessage_(action){

  if(isMutationAction_(action)){
    return "処理に時間がかかっています。保存や登録の場合は、画面を再読み込みして反映状況を確認してから再操作してください。";
  }

  return "読み込みに時間がかかっています。画面を再読み込みするか、条件を絞って再度お試しください。";
}

function cleanupJsonpCallback_(callbackName, script){

  delete window[callbackName];

  if(script && script.parentNode){
    script.parentNode.removeChild(script);
  }
}

function isSaveAction_(action){

  return /^save[A-Za-z0-9_]*Jsonp$/.test(
    String(action || "")
  );
}

function beginSaveFeedback_(action){

  if(!isSaveAction_(action)){
    return null;
  }

  const button =
    lastClickedSaveButton_;

  const feedback = {
    button: button,
    originalText: button ? button.textContent : "",
    changedButton: false
  };

  if(button && !button.disabled){
    button.disabled =
      true;

    button.textContent =
      "保存中...";

    feedback.changedButton =
      true;
  }

  showSaveToast_(
    "保存中...",
    "info"
  );

  return feedback;
}

function finishSaveFeedback_(feedback, ok, message){

  if(!feedback){
    return;
  }

  const text =
    ok
      ? (message || "保存しました。")
      : (message || "保存できませんでした。");

  if(feedback.button && feedback.changedButton){
    feedback.button.textContent =
      ok ? "保存しました" : "保存";

    setTimeout(function(){
      if(feedback.button){
        feedback.button.disabled =
          false;

        feedback.button.textContent =
          feedback.originalText || "保存";
      }
    }, ok ? 1800 : 300);
  }

  showSaveToast_(
    text,
    ok ? "ok" : "ng"
  );

  lastClickedSaveButton_ =
    null;
}

function showSaveToast_(message, type){

  let toast =
    document.getElementById("saveFeedbackToast");

  if(!toast){
    toast =
      document.createElement("div");

    toast.id =
      "saveFeedbackToast";

    toast.style.position =
      "fixed";

    toast.style.right =
      "18px";

    toast.style.top =
      "18px";

    toast.style.zIndex =
      "99999";

    toast.style.maxWidth =
      "360px";

    toast.style.padding =
      "12px 16px";

    toast.style.borderRadius =
      "8px";

    toast.style.boxShadow =
      "0 4px 18px rgba(0,0,0,.18)";

    toast.style.fontWeight =
      "bold";

    toast.style.lineHeight =
      "1.5";

    document.body.appendChild(toast);
  }

  toast.textContent =
    message;

  if(type === "ok"){
    toast.style.background =
      "#e8f7ee";
    toast.style.color =
      "#007a2f";
    toast.style.border =
      "1px solid #99d8ad";
  }else if(type === "ng"){
    toast.style.background =
      "#fff0f0";
    toast.style.color =
      "#b00020";
    toast.style.border =
      "1px solid #f1a0a8";
  }else{
    toast.style.background =
      "#eef5ff";
    toast.style.color =
      "#0f3a66";
    toast.style.border =
      "1px solid #bcd2ee";
  }

  toast.style.display =
    "block";

  clearTimeout(toast._hideTimer);

  toast._hideTimer =
    setTimeout(function(){
      toast.style.display =
        "none";
    }, type === "info" ? 6000 : 3500);
}

function escapeHtml(text){

  return String(text === null || text === undefined ? "" : text)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function escapeJs(text){

  return String(text === null || text === undefined ? "" : text)
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'");
}

function ensureAppModal(){

  let backdrop =
    document.getElementById("appModalBackdrop");

  if(backdrop){
    return backdrop;
  }

  backdrop =
    document.createElement("div");

  backdrop.id =
    "appModalBackdrop";

  backdrop.className =
    "app-modal-backdrop";

  backdrop.onclick =
    function(event){
      if(event.target === backdrop){
        closeAppModal();
      }
    };

  backdrop.innerHTML =
    '<div id="appModalPanel" class="app-modal" role="dialog" aria-modal="true" aria-labelledby="appModalTitle">' +
      '<div class="app-modal-header">' +
        '<h2 id="appModalTitle"></h2>' +
        '<button type="button" class="app-modal-close" onclick="closeAppModal()">閉じる</button>' +
      '</div>' +
      '<div id="appModalBody" class="app-modal-body"></div>' +
    '</div>';

  document.body.appendChild(backdrop);

  return backdrop;
}

function openAppModal(title, bodyHtml, options){

  const backdrop =
    ensureAppModal();

  const panel =
    document.getElementById("appModalPanel");

  panel.className =
    "app-modal" + (options && options.wide ? " wide" : "");

  document.getElementById("appModalTitle").textContent =
    title || "詳細";

  document.getElementById("appModalBody").innerHTML =
    bodyHtml || "";

  backdrop.classList.add("open");
}

function closeAppModal(){

  const backdrop =
    document.getElementById("appModalBackdrop");

  if(backdrop){
    backdrop.classList.remove("open");
  }
}

function buildDetailRows(items){

  let html =
    '<div class="app-detail-grid">';

  items.forEach(function(item){

    html +=
      '<div class="app-detail-label">' +
        escapeHtml(item.label || "") +
      '</div>' +
      '<div class="app-detail-value">' +
        (item.html !== undefined ? item.html : escapeHtml(item.value || "")) +
      '</div>';
  });

  html +=
    '</div>';

  return html;
}

function formatNow(){

  const d =
    new Date();

  const yyyy =
    d.getFullYear();

  const mm =
    String(d.getMonth() + 1).padStart(2,"0");

  const dd =
    String(d.getDate()).padStart(2,"0");

  const hh =
    String(d.getHours()).padStart(2,"0");

  const mi =
    String(d.getMinutes()).padStart(2,"0");

  return yyyy + "年" + mm + "月" + dd + "日 " + hh + ":" + mi;
}

function formatDateTimeDisplay(value){

  const text =
    String(value || "").trim();

  if(!text){
    return "";
  }

  const parsed =
    new Date(text);

  if(isNaN(parsed.getTime())){
    return text;
  }

  const yyyy =
    parsed.getFullYear();

  const mm =
    String(parsed.getMonth() + 1).padStart(2,"0");

  const dd =
    String(parsed.getDate()).padStart(2,"0");

  const hh =
    String(parsed.getHours()).padStart(2,"0");

  const mi =
    String(parsed.getMinutes()).padStart(2,"0");

  return yyyy + "/" + mm + "/" + dd + " " + hh + ":" + mi;
}

function formatFlagLabel(value, trueLabel, falseLabel){

  return String(value || "TRUE").toUpperCase() === "FALSE"
    ? (falseLabel || "無効")
    : (trueLabel || "有効");
}

function buildFlagOptions(currentValue, trueLabel, falseLabel){

  const value =
    String(currentValue || "TRUE").toUpperCase() === "FALSE"
      ? "FALSE"
      : "TRUE";

  return '<option value="TRUE"' +
    (value === "TRUE" ? " selected" : "") +
    '>' +
    escapeHtml(trueLabel || "有効") +
    '</option>' +
    '<option value="FALSE"' +
    (value === "FALSE" ? " selected" : "") +
    '>' +
    escapeHtml(falseLabel || "無効") +
    '</option>';
}

function getReceptionTypeLabel(value){

  const text =
    String(value || "").trim();

  if(text === "会社QR"){
    return "会社別QR受付";
  }

  if(text === "手入力"){
    return "会場QR＋検索受付";
  }

  if(text === "スマホ登録"){
    return "スマホ事前登録＋会場QR受付";
  }

  if(text === "WEBフォーム"){
    return "会場QR＋検索受付";
  }

  return text || "未設定";
}

function saveLongText_(text, callback){

  const value =
    String(text || "");

  jsonp(
    "startLongTextJsonp",
    {},
    function(startRes){

      if(!startRes || !startRes.ok){
        callback({
          ok: false,
          message: startRes && startRes.message
            ? startRes.message
            : "本文保存の準備に失敗しました。"
        });
        return;
      }

      const token =
        startRes.token;

      const chunks = [];

      for(let i = 0; i < value.length; i += 250){
        chunks.push(value.substring(i, i + 250));
      }

      function sendChunk(index){

        if(index >= chunks.length){
          callback({
            ok: true,
            token: token
          });
          return;
        }

        jsonp(
          "appendLongTextChunkJsonp",
          {
            token: token,
            chunk: chunks[index]
          },
          function(appendRes){

            if(!appendRes || !appendRes.ok){
              callback({
                ok: false,
                message: appendRes && appendRes.message
                  ? appendRes.message
                  : "本文の保存に失敗しました。"
              });
              return;
            }

            sendChunk(index + 1);
          }
        );
      }

      sendChunk(0);
    }
  );
}


function jsonpWithLongBody(action, data, callback){

  const body =
    String(data.body || "");

  if(body.length <= 1200){
    jsonp(
      action,
      data,
      callback,
      120000
    );
    return;
  }

  saveLongText_(
    body,
    function(longRes){

      if(!longRes || !longRes.ok){
        callback(longRes);
        return;
      }

      const sendData =
        Object.assign({}, data);

      sendData.body =
        "";

      sendData.bodyToken =
        longRes.token;

      jsonp(
        action,
        sendData,
        callback,
        120000
      );
    }
  );
}

function getCurrentPageName_(){

  const path =
    window.location.pathname || "";

  const fileName =
    path.substring(path.lastIndexOf("/") + 1);

  return fileName || "index.html";
}

function getAuthSessionToken_(){

  return localStorage.getItem(AUTH_SESSION_STORAGE_KEY) || "";
}

function setAuthSession(token, user){

  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    token || ""
  );

  localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify(user || {})
  );

  currentAuthState_.user =
    user || null;
}

function clearAuthSession(){

  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);

  currentAuthState_.user =
    null;
}

function getStoredAuthUser_(){

  try{
    return JSON.parse(
      localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null"
    );
  }catch(e){
    return null;
  }
}

function getCurrentAuthUser(){

  return currentAuthState_.user || getStoredAuthUser_();
}

function normalizeRoleList_(roles){

  if(Array.isArray(roles)){
    return roles;
  }

  return String(roles || "")
    .split(",")
    .map(function(role){
      return role.trim();
    })
    .filter(Boolean);
}

function hasAuthRole_(user, roles){

  const role =
    user && user.role
      ? String(user.role)
      : "";

  if(!role){
    return false;
  }

  return normalizeRoleList_(roles).indexOf(role) !== -1;
}

function redirectForbiddenUser_(){

  const page =
    getCurrentPageName_();

  if(page !== "index.html"){
    alert("このページを開く権限がありません。");
    window.location.href =
      "index.html";
    return;
  }

  applyAuthVisibility_();
  renderGlobalNav_();
}

function getCurrentPageRoles_(){

  const page =
    getCurrentPageName_();

  if(AUTH_PUBLIC_PAGES[page]){
    return [];
  }

  return AUTH_PAGE_ROLES[page] || ["admin", "staff"];
}

function getLoginRedirectUrl_(){

  return "login.html?next=" +
    encodeURIComponent(
      window.location.pathname.split("/").pop() +
      window.location.search
    );
}

function applyAuthVisibility_(){

  const user =
    getCurrentAuthUser();

  document
    .querySelectorAll("[data-auth-roles]")
    .forEach(function(el){

      if(!currentAuthState_.enabled){
        el.style.display =
          "";
        return;
      }

      const visible =
        hasAuthRole_(
          user,
          el.getAttribute("data-auth-roles")
        );

      el.style.display =
        visible ? "" : "none";
    });
}

function handleAuthFailure_(res){

  if(!res || (!res.authRequired && !res.forbidden)){
    return false;
  }

  if(res.authRequired){
    clearAuthSession();
    window.location.href =
      getLoginRedirectUrl_();
    return true;
  }

  alert(res.message || "この操作を行う権限がありません。");
  return true;
}

function loadAuthState_(callback){

  jsonp(
    "getAuthConfigJsonp",
    {},
    function(res){

      currentAuthState_.loaded =
        true;

      currentAuthState_.enabled =
        !!(res && res.ok && res.enabled);

      currentAuthState_.user =
        res && res.user
          ? res.user
          : getStoredAuthUser_();

      callback(res || {});
    },
    10000
  );
}

function logoutAuth(){

  jsonp(
    "logoutJsonp",
    {},
    function(){
      clearAuthSession();
      window.location.href =
        "login.html";
    },
    10000
  );
}

function initAuthPage_(callback){

  loadAuthState_(function(){

    const roles =
      getCurrentPageRoles_();

    if(
      currentAuthState_.enabled &&
      roles.length &&
      !hasAuthRole_(currentAuthState_.user, roles)
    ){
      if(currentAuthState_.user){
        redirectForbiddenUser_();
        return;
      }

      clearAuthSession();
      window.location.href =
        getLoginRedirectUrl_();
      return;
    }

    applyAuthVisibility_();

    if(callback){
      callback();
    }
  });
}

function getGlobalNavLinks_(){

  const page =
    getCurrentPageName_();

  if(
    page === "index.html" ||
    AUTH_PUBLIC_PAGES[page]
  ){
    return [];
  }

  if(
    page === "self-checkin.html" ||
    page === "guest-checkin.html" ||
    page === "poster.html" ||
    page === "reset-poster.html" ||
    page === "member-register.html"
  ){
    return [];
  }

  const links =
    [];

  function add(label, href, primary){
    if(page === href){
      return;
    }

    links.push({
      label: label,
      href: href,
      primary: !!primary
    });
  }

  if(page.indexOf("certificate") === 0){
    add("修了証管理", "certificate-menu.html", true);
    add("トップ", "index.html", false);
    return links;
  }

  if(
    page.indexOf("member-") === 0 ||
    page.indexOf("organization-") === 0 ||
    page.indexOf("personal-member-") === 0 ||
    page === "personal-member-master.html" ||
    page === "member-org-menu.html"
  ){
    add("会員・組織管理", "member-org-menu.html", true);
    add("トップ", "index.html", false);
    return links;
  }

  if(
    page === "settings.html" ||
    page === "auth-user-setting.html"
  ){
    add("システム設定", "settings.html", true);
    add("トップ", "index.html", false);
    return links;
  }

  if(page.indexOf("mail-") === 0){
    add("研修会管理", "training-menu.html", true);
    add("トップ", "index.html", false);
    return links;
  }

  if(
    page.indexOf("checkin") === 0 ||
    page.indexOf("staff-") === 0 ||
    page === "live-checkin.html"
  ){
    add("研修会管理", "training-menu.html", true);
    add("トップ", "index.html", false);
    return links;
  }

  if(
    page.indexOf("training-") === 0 ||
    page === "venue-history.html" ||
    page === "history.html" ||
    page === "stats.html" ||
    page === "individual-stats.html" ||
    page === "annual-stats.html" ||
    page === "follow-analysis.html" ||
    page === "training-menu.html"
  ){
    add("研修会管理", "training-menu.html", true);
    add("トップ", "index.html", false);
    return links;
  }

  add("トップ", "index.html", true);
  return links;
}

function renderGlobalNav_(){

  if(AUTH_PUBLIC_PAGES[getCurrentPageName_()]){
    return;
  }

  const links =
    getGlobalNavLinks_();

  const showLogout =
    currentAuthState_.enabled &&
    !!currentAuthState_.user;

  if(!links.length && !showLogout){
    return;
  }

  if(document.querySelector(".global-nav")){
    return;
  }

  const nav =
    document.createElement("nav");

  nav.className =
    "global-nav";

  nav.innerHTML =
    '<div class="global-nav-inner">' +
    links.map(function(link){
      return '<a href="' +
        escapeHtml(link.href) +
        '" class="' +
        (link.primary ? "primary" : "") +
        '">' +
        escapeHtml(link.label) +
        '</a>';
    }).join("") +
    (
      showLogout
        ? '<button type="button" class="global-nav-logout" onclick="logoutAuth()">ログアウト</button>'
        : ""
    ) +
    '</div>';

  const header =
    document.querySelector("header");

  if(header && header.parentNode){
    header.parentNode.insertBefore(
      nav,
      header.nextSibling
    );
    return;
  }

  document.body.insertBefore(
    nav,
    document.body.firstChild
  );
}

function initCommonPage_(){

  initAuthPage_(function(){
    renderGlobalNav_();
  });
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initCommonPage_);
}else{
  initCommonPage_();
}
