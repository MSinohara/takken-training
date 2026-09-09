# SQL全面移行：GAS依存一覧

対象はデータ保存・読込のSQL統一。メール配送、PDF生成、ファイル保管、本人認証はSQLそのものとは別のサービスとして整理する。

## 固定条件

- 開発環境で検証し、本番と旧データを不用意に更新・削除しない。
- メールは大境不動産（41796）の登録先以外へ絶対に送信しない。全体移行中は送信テストを行わない。
- SQLを正本にし、GASへの自動フォールバック・二重保存を段階的に廃止する。

## 作業順

1. 残る出欠項目・回答データの移行と照合。
2. 出欠管理画面の旧読込、設定の二重保存、旧回答APIを整理。メール処理の参照先も同時に変更する。
3. メール差出人・署名・履歴・配信対象、研修記録と添付情報のSQL化。
4. 修了証ルール・発行元・発行履歴、残る受付機能、利用者権限・操作ログのSQL化。
5. 全画面の結合試験、データ照合、旧経路停止、本番移行手順の検証。

## 静的検出結果（稼働中の画面内スクリプト）

text/plainの退避コードは除外。SQLによる実行時の置換は別途確認が必要で、この一覧の件数だけで未移行を断定しない。共通JS内のGAS認証・長文転送等は下表とは別の依存として残る。

|画面|GAS操作|SQLモジュール参照|
|---|---|---|
|certificate-history.html|createCertificatePdfJsonp、sendCertificatePdfJsonp、sendCertificatePdfBulkJsonp|sql/js/certificate-history-ui.js|
|certificate-rule-summary.html|getCertificateRulesJsonp、previewCertificatePdfJsonp|なし|
|certificate.html|createCertificatePdfJsonp|sql/js/certificate-targets-ui.js|
|demo-mail.html|getDemoLocationMailJsonp|なし|
|location-checkin.html|getLocationCheckinTokenJsonp、registerLocationCheckinJsonp|なし|
|login.html|loginJsonp|なし|
|mail-sender-setting.html|sendMailSenderTestJsonp|sql/js/mail-senders.js|
|member-register.html|getMemberJsonp|sql/js/public-training-display.js|
|staff-checkin.html|getPlannedAttendeesJsonp、searchCheckinIndexMembersJsonp、searchMembersJsonp、getPersonalMembersJsonp、resendTrainingMailJsonp|sql/js/qr-checkin.js、sql/js/public-training-display.js|
|training-detail.html|getCheckinMonitorJsonp、getCheckinTargetMembersJsonp、getCheckinIndexJobStatusJsonp、startCheckinIndexJobJsonp、buildCheckinIndexChunkJsonp、backupTrainingJsonp|sql/js/detail-stats.js|
|training-mail-preview.html|getDemoLocationMailJsonp|なし|
