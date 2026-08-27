import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
} from "firebase/auth";

const ADMIN_EMAILS = ["ohzakai.kk@gmail.com"];

export function requireSqlAdmin(app, statusElement) {
  const auth = getAuth(app);
  return new Promise((resolve, reject) => {
    getRedirectResult(auth).catch((error) => {
      statusElement.innerHTML = `<span class="ng">管理者確認に失敗しました。${String(error.message || error)}</span>`;
      reject(error);
    });
    const stop = onAuthStateChanged(auth, (user) => {
      if (user && ADMIN_EMAILS.includes(String(user.email || "").toLowerCase())) {
        stop();
        resolve(user);
        return;
      }
      if (user) {
        statusElement.innerHTML = '<span class="ng">このGoogleアカウントには管理権限がありません。</span>';
        return;
      }
      statusElement.innerHTML = '<strong>管理者確認が必要です。</strong><br>' +
        '<button type="button" class="btn" id="sqlAdminSignIn" style="margin-top:10px;">Googleアカウントで確認</button>';
      document.getElementById("sqlAdminSignIn").onclick = async () => {
        try {
          statusElement.innerHTML = "Googleアカウント確認へ移動しています...";
          await signInWithRedirect(auth, new GoogleAuthProvider());
        } catch (error) {
          statusElement.innerHTML = `<span class="ng">管理者確認に失敗しました。${String(error.message || error)}</span>`;
          reject(error);
        }
      };
    });
  });
}
