# GitHub運用メモ

このリポジトリは、研修会受付システムの開発コードを管理するためのものです。

## 基本方針

- GitHubには開発環境のコードを正本として保存します。
- 本番GASへの反映は、協会側Googleアカウントで手動デプロイします。
- `.clasp.json` はGASの接続先IDを含むため、GitHubには保存しません。
- `.clasp.dev.example.json` と `.clasp.prod.example.json` は見本です。実際に使う場合は、どちらかを `.clasp.json` にコピーして使います。

## 開発環境

開発GASは `ohzakai.kk` 側のApps Scriptを使います。

## 本番環境

本番GASは `tokyotakken10` 側のApps Scriptを使います。

本番反映時は、GASコードをpushした後、Apps Script画面でデプロイを更新します。

## GitHubに載せないもの

- `.clasp.json`
- `.clasprc.json`
- `node_modules`
- `.npm-cache`
- Firebase/GASの一時ファイル
- ログファイル
- バックアップフォルダ
