# 修了証ルール設定 GAS 追加手順

作成日: 2026-06-22

このメモは、Firebase 側に追加した以下の画面を GAS 側で動かすための作業内容です。

```text
public/certificate-rule-setting.html
public/certificate.html
```

## やりたいこと

今までの修了証対象は、参加履歴から「2回以上参加」を固定で抽出する形でした。

今後は、画面で登録した修了証ルールごとに対象者を抽出します。

例:

```text
第十ブロック研修を3回以上
杉並支部研修を2回以上
杉並支部研修を2回以上 + ブロック研修を1回以上
青年部会研修を1回以上 + レディス会研修を1回以上
指定研修 2026-005 は必須
指定研修 2026-010 / 2026-011 のどちらか必須
```

さらに、ルールごとに修了証の文面や様式を変えられるようにする。

例:

```text
ブロック研修用の修了証
杉並支部研修用の修了証
青年部会用の修了証
レディス会用の修了証
```

## GAS 側で追加するシート

### 1. 修了証ルール

ルール本体を保存するシート。

```text
ルールID
ルール名
対象年度
有効
証書タイトル
証書本文
発行者肩書
発行者氏名
PDF様式
備考
作成日時
更新日時
```

各列の意味:

```text
ルールID: CR-001 など。GASで自動発番。
ルール名: 画面で選ぶ名前。例: 杉並支部 修了証。
対象年度: 2026 など。空欄でも可。
有効: TRUE / FALSE。
証書タイトル: PDFに出すタイトル。例: 研修修了証。
証書本文: PDFに出す本文。
発行者肩書: 例: 東京都宅地建物取引業協会 第十ブロック長。
発行者氏名: 例: 山田 太郎。
PDF様式: standard / block / branch / organization など。
備考: 管理用メモ。
作成日時: 新規作成日時。
更新日時: 最終更新日時。
```

画面側では `証書タイトル`、`証書本文`、`発行者肩書`、`発行者氏名`、`PDF様式`、`備考` を送る。

### 2. 修了証条件

1つの修了証ルールに対して、複数の条件を保存するシート。

```text
ルールID
条件番号
条件タイプ
必要回数
必須研修判定
対象主催区分
対象ブロック
対象支部
対象地区
対象組織ID
対象研修ID
```

値の意味:

```text
条件タイプ: count / required
必要回数: count のときに使用。例: 2, 3。
必須研修判定: required のときに使用。all / any。
対象主催区分: 第十ブロック、杉並支部、青年部会など。
対象ブロック: 第十ブロックなど。
対象支部: 杉並支部、中野支部、世田谷支部など。
対象地区: 地区指定が必要な場合だけ。
対象組織ID: 青年部会、レディス会などの組織ID。カンマ区切り可。
対象研修ID: 2026-001,2026-002 のようにカンマ区切り可。
```

条件タイプの意味:

```text
count:
  条件に一致する研修への参加回数を数える。
  必要回数以上なら条件達成。

required:
  対象研修IDに指定した研修への参加を確認する。
  all なら指定研修すべて必須。
  any なら指定研修のいずれか1つでOK。
```

### 3. 修了証発行者

ブロック長・支部長など、修了証に記載する発行者を事前登録するシート。

```text
発行者ID
役職名
発行者肩書
発行者氏名
有効
備考
作成日時
更新日時
```

例:

```text
発行者ID: CI-001
役職名: 第十ブロック長
発行者肩書: 東京都宅地建物取引業協会 第十ブロック長
発行者氏名: 山田 太郎
有効: TRUE
```

### 4. 修了証対象

既存の `修了証対象` シートに、できれば以下の列を追加する。

```text
ルールID
ルール名
証書タイトル
PDF様式
```

既存列は維持する。

現在の想定:

```text
作成日時
業者番号
会社名
参加回数
参加研修ID
修了証発行対象
PDFファイルID
PDFURL
発行日時
送信対象
送信日時
送信結果
送信先メール
非表示
備考
ルールID
ルール名
証書タイトル
PDF様式
```

ルール未選択の従来抽出では、`ルールID` と `ルール名` は空欄でもよい。

## doGet に追加・確認する action

GAS の `doGet(e)` に以下を追加する。

```javascript
if (e.parameter.action === "getCertificateRulesJsonp") {
  return getCertificateRulesJsonp_(e);
}

if (e.parameter.action === "saveCertificateRuleJsonp") {
  return saveCertificateRuleJsonp_(e);
}

if (e.parameter.action === "getCertificateIssuersJsonp") {
  return getCertificateIssuersJsonp_(e);
}

if (e.parameter.action === "saveCertificateIssuerJsonp") {
  return saveCertificateIssuerJsonp_(e);
}
```

既存 action は、`ruleId` パラメータを受け取るように拡張する。

```javascript
if (action === "createCertificateTargetsJsonp") {
  return createCertificateTargetsJsonp_(e);
}

if (action === "getCertificateTargetsJsonp") {
  return getCertificateTargetsJsonp_(e);
}

if (action === "createCertificatePdfJsonp") {
  return createCertificatePdfJsonp_(e);
}
```

## 追加する JSONP 関数

### getCertificateRulesJsonp_(e)

画面:

```text
certificate-rule-setting.html
certificate.html
```

役割:

```text
修了証ルールと修了証条件を読み取り、ルールごとに conditions 配列を付けて返す。
有効 FALSE も設定画面では表示する。
発行画面では Firebase 側で active !== "FALSE" のものだけ選択肢に出す。
```

返却例:

```javascript
{
  ok: true,
  rules: [
    {
      ruleId: "CR-001",
      ruleName: "杉並支部 修了証",
      targetYear: "2026",
      active: "TRUE",
      certificateTitle: "研修修了証",
      certificateBody: "所定の研修を修了したことを証します。",
      issuerTitle: "杉並支部長",
      issuerName: "山田 太郎",
      pdfTemplate: "branch",
      note: "",
      updatedAt: "2026/06/22 10:00:00",
      previewPdfUrl: "https://drive.google.com/...",
      previewFileId: "xxxxxxxx",
      previewSourceUpdatedAt: "2026/06/22 10:00:00",
      conditions: [
        {
          conditionType: "count",
          requiredCount: "2",
          requiredMode: "all",
          targetHostType: "",
          targetBlock: "",
          targetBranch: "杉並支部",
          targetDistrict: "",
          targetOrgIds: "",
          targetEventIds: ""
        },
        {
          conditionType: "required",
          requiredCount: "1",
          requiredMode: "all",
          targetHostType: "",
          targetBlock: "",
          targetBranch: "",
          targetDistrict: "",
          targetOrgIds: "",
          targetEventIds: "2026-005"
        }
      ]
    }
  ]
}
```

### saveCertificateRuleJsonp_(e)

画面:

```text
certificate-rule-setting.html
```

受け取るパラメータ:

```text
ruleId
ruleName
targetYear
active
certificateTitle
certificateBody
issuerTitle
issuerName
pdfTemplate
note
conditionsJson
```

処理:

```text
1. ruleId が空なら新規作成。CR-001 のように自動発番。
2. ruleId があれば既存更新。
3. 修了証ルール シートを更新。
4. 修了証条件 シートから同じ ruleId の行を削除。
5. conditionsJson を JSON.parse して、条件番号 1,2,3... で保存。
6. { ok: true, message: "保存しました。" } を返す。
```

注意:

```text
conditionsJson は URL パラメータで送っているため、条件が極端に多い場合は URL 長制限に注意。
通常の運用では問題ない想定。
```

### previewCertificatePdfJsonp_(e)

画面:

```text
certificate-rule-setting.html
```

受け取るパラメータ:

```text
ruleId
forceCreate
```

役割:

```text
保存済みルールを修了証テンプレートへ差し込んだPDFプレビューを返す。
ルールに変更がない場合は、前回作成済みのプレビューPDF URLを返す。
forceCreate が TRUE の場合だけ、プレビューPDFを作り直す。
```

修了証ルール シートに追加する列:

```text
プレビューPDFファイルID
プレビューPDFURL
プレビュー元更新日時
プレビュー作成日時
```

処理:

```text
1. ruleId から修了証ルールを読む。
2. forceCreate !== "TRUE" かつ プレビューPDFURL があり、
   プレビュー元更新日時 === ルールの updatedAt なら、新しいPDFは作らず既存URLを返す。
3. それ以外の場合だけPDFプレビューを作成する。
4. 作成したファイルID、URL、ルールの updatedAt、プレビュー作成日時を修了証ルールへ保存する。
5. { ok: true, url: previewPdfUrl, reused: true/false } を返す。
```

返却例:

```javascript
{
  ok: true,
  url: "https://drive.google.com/...",
  previewPdfUrl: "https://drive.google.com/...",
  reused: true,
  message: "保存済みのPDFプレビューを開きます。"
}
```

注意:

```text
保存処理でルール本文・発行者・PDF様式・条件などを変更した場合は、updatedAt を必ず更新する。
これにより、次回プレビュー時に古いPDFを誤って再利用しない。
```

### getCertificateIssuersJsonp_(e)

画面:

```text
certificate-issuer-setting.html
certificate-rule-setting.html
```

役割:

```text
修了証発行者 シートから発行者一覧を返す。
修了証ルール設定画面では active !== "FALSE" のものだけ引用候補に出す。
```

返却例:

```javascript
{
  ok: true,
  issuers: [
    {
      issuerId: "CI-001",
      roleName: "第十ブロック長",
      issuerTitle: "東京都宅地建物取引業協会 第十ブロック長",
      issuerName: "山田 太郎",
      active: "TRUE",
      note: "",
      updatedAt: "2026/06/22 10:00:00"
    }
  ]
}
```

### saveCertificateIssuerJsonp_(e)

画面:

```text
certificate-issuer-setting.html
```

受け取るパラメータ:

```text
issuerId
roleName
issuerTitle
issuerName
active
note
```

処理:

```text
1. issuerId が空なら新規作成。CI-001 のように自動発番。
2. issuerId があれば既存更新。
3. 修了証発行者 シートを更新。
4. { ok: true, message: "保存しました。" } を返す。
```

## 既存関数の拡張

### createCertificateTargetsJsonp_(e)

追加で受け取る:

```javascript
const ruleId =
  String(e.parameter.ruleId || "").trim();
```

処理分岐:

```text
ruleId が空:
  従来どおり、参加履歴から2回以上参加の会社を抽出する。

ruleId がある:
  createCertificateTargetsByRule_(ruleId) のような関数で、ルール判定を行う。
```

返却例:

```javascript
{
  ok: true,
  message: "修了証対象を抽出しました。",
  targetCount: 12
}
```

### getCertificateTargetsJsonp_(e)

追加で受け取る:

```javascript
const ruleId =
  String(e.parameter.ruleId || "").trim();
```

処理:

```text
ruleId が空なら従来どおり全対象または従来対象を返す。
ruleId があるなら、修了証対象 シートの ルールID が一致する行だけ返す。
```

返却項目は既存画面に合わせる。

```javascript
{
  ok: true,
  targets: [
    {
      rowNo: 2,
      memberNo: "12345",
      companyName: "株式会社サンプル",
      count: 3,
      eventIds: "2026-001,2026-002,2026-005",
      pdfUrl: "",
      issuedAt: "",
      ruleId: "CR-001",
      ruleName: "杉並支部 修了証"
    }
  ]
}
```

### createCertificatePdfJsonp_(e)

既存の PDF 発行関数を、ルール情報も使えるようにする。

処理:

```text
1. rowNo から 修了証対象 の行を読む。
2. ルールID があれば 修了証ルール を読む。
3. 証書タイトル、証書本文、発行者肩書、発行者氏名、PDF様式を決める。
4. PDFを作成する。
5. PDFファイルID、PDFURL、発行日時を 修了証対象 に保存する。
```

ルールID が空の場合は、従来のPDF文面・様式で発行する。

## ルール判定の考え方

### 全体

1つのルールに複数条件がある場合、すべての条件を満たした会員だけが修了証対象。

```text
条件1 OK
条件2 OK
条件3 OK
=> 修了証対象
```

どれか1つでも満たしていなければ対象外。

### 回数条件 count

例:

```text
杉並支部研修を2回以上
```

判定:

```text
その会員の参加履歴を取得
参加した研修IDから研修会情報を取得
条件に合う研修だけ数える
必要回数以上ならOK
```

条件に使う項目:

```text
対象主催区分
対象ブロック
対象支部
対象地区
対象組織ID
対象研修ID
```

### 必須研修 required

例:

```text
2026-005 は必須
```

判定:

```text
targetEventIds に 2026-005 が入っている
その会員が 2026-005 に参加していればOK
```

`requiredMode` の意味:

```text
all:
  targetEventIds に入っている研修すべてに参加していればOK。

any:
  targetEventIds に入っている研修のうち、どれか1つに参加していればOK。
```

## 対象研修の一致条件

研修会の情報は `findTrainingById_()` または研修会一覧から取得する。

条件との一致は以下で見る。

```text
targetHostType:
  研修会の 主催区分 と一致。

targetBlock:
  研修会の 対象ブロック と一致。

targetBranch:
  研修会の 対象支部 と一致。

targetDistrict:
  研修会の 対象地区 と一致。

targetOrgIds:
  研修会の 対象組織ID と重なりがある。

targetEventIds:
  研修ID がリストに含まれる。
```

空欄の条件は絞り込まない。

## 注意点

### 研修対象と参加実績は別

修了証判定は、基本的に参加履歴を元にする。

ただし、回数条件で「杉並支部研修」と見る場合は、参加した研修そのものの主催区分・対象支部・対象組織などで判定する。

### `修了証発行` が FALSE の研修

研修会シートの `修了証発行` が FALSE の研修は、原則として修了証判定から除外する。

ただし、必須研修として明示的に指定した場合も除外するかどうかは運用判断。

おすすめ:

```text
修了証発行 FALSE の研修は常に除外
```

理由:

会議や部会などを誤って修了証条件に含める事故を避けるため。

### 重複受付

参加履歴は同一研修・同一業者番号で重複登録しない方針。

もし重複がある場合でも、修了証判定では同じ研修IDは1回として数える。

## PDF様式の段階対応

最初から完全自由レイアウトにはしない。

おすすめは以下。

### 第1段階

ルールごとに文言を変える。

```text
証書タイトル
証書本文
発行者肩書
発行者氏名
```

### 第2段階

PDF様式を選択式にする。

```text
standard
block
branch
organization
```

GAS 側では `PDF様式` の値で PDF の配置や文言を切り替える。

### 第3段階

背景画像や印影、フォント位置などを細かく変えたい場合に、別途テンプレート設定画面を検討する。

## 実装順序

おすすめ順:

```text
1. 修了証ルール シートを追加
2. 修了証条件 シートを追加
3. 修了証発行者 シートを追加
4. getCertificateIssuersJsonp_ / saveCertificateIssuerJsonp_ を追加
5. getCertificateRulesJsonp_ を追加
6. saveCertificateRuleJsonp_ を追加
7. doGet に action を追加
8. 画面から発行者とルールを保存できるか確認
9. createCertificateTargetsJsonp_ に ruleId を追加
10. ルール判定関数を追加
11. getCertificateTargetsJsonp_ に ruleId 絞り込みを追加
12. PDF発行でルールの証書タイトル・本文・発行者を使う
13. PDF様式の切り替えを追加
```

## 画面側の現在の状態

Firebase 側では、すでに以下を追加済み。

```text
certificate-rule-setting.html
  getCertificateIssuersJsonp を呼ぶ
  getCertificateRulesJsonp を呼ぶ
  saveCertificateRuleJsonp を呼ぶ

certificate-issuer-setting.html
  getCertificateIssuersJsonp を呼ぶ
  saveCertificateIssuerJsonp を呼ぶ

certificate.html
  getCertificateRulesJsonp を呼ぶ
  createCertificateTargetsJsonp に ruleId を渡す
  getCertificateTargetsJsonp に ruleId を渡す
```

GAS 側が未実装の場合、画面には「取得できませんでした」系の表示が出る。

## 代表的なルール例

### 第十ブロック研修を3回

```text
修了証ルール
ルール名: 第十ブロック 修了証
証書タイトル: 第十ブロック研修 修了証
PDF様式: block

修了証条件
条件タイプ: count
必要回数: 3
対象主催区分: 第十ブロック
```

### 杉並支部研修を2回 + 必須研修

```text
修了証ルール
ルール名: 杉並支部 修了証
証書タイトル: 杉並支部研修 修了証
PDF様式: branch

修了証条件 1
条件タイプ: count
必要回数: 2
対象支部: 杉並支部

修了証条件 2
条件タイプ: required
必須研修判定: all
対象研修ID: 2026-005
```

### 青年部会とレディス会をそれぞれ1回

```text
修了証ルール
ルール名: 青年部会・レディス会 合同修了証
PDF様式: organization

修了証条件 1
条件タイプ: count
必要回数: 1
対象組織ID: 青年部会の組織ID

修了証条件 2
条件タイプ: count
必要回数: 1
対象組織ID: レディス会の組織ID
```
