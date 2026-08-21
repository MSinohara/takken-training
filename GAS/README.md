# 宅建研修システム GAS

対象GAS:

```text
1x6VS29Olp_HZES95ApKdWqCMHZ_dN6tajTulgutb4BA3GSG4SBl-IQ7J
```

このフォルダは宅建研修システムの Google Apps Script を `clasp` で管理するための場所です。

## 初回取得

このフォルダで実行します。

```powershell
$env:NODE_OPTIONS="--use-system-ca"
$env:npm_config_cache="C:\Users\sinohara\Documents\Codex\takken-training\GAS\.npm-cache"
npm.cmd install
npm.cmd run clasp -- login
npm.cmd run pull
```

`clasp pull` 後に、GASエディタ上の既存コードがこのフォルダへ取得されます。

## bat操作

通常はこちらを使います。

```text
gas-status.bat     状態確認
gas-download.bat   Google上のGASをPCへ取り込み
gas-upload.bat     PCのGASをGoogleへアップロード
```

`gas-upload.bat` は誤操作防止のため、`YES` と入力した場合だけ `clasp push` を実行します。

## 反映

ローカルで修正したあと、このフォルダで実行します。

```powershell
npm.cmd run push
```

GAS側のWebアプリを更新する場合は、GASエディタ側でデプロイ更新も必要です。

## 注意

- 自社システム側のGASとは混ぜないこと。
- このフォルダは宅建研修システム専用。
- `.claspignore` で `.gs` / `.js` と `appsscript.json` 以外はpush対象外にしています。
- 既存GASを取得する前にローカルで `.gs` を作ってpushすると、GAS側を上書きする可能性があるため、最初は必ず `clasp pull` から始めます。
- PowerShellでは `npm` ではなく `npm.cmd` を使います。
- npmの証明書エラーが出る場合があるため、`NODE_OPTIONS=--use-system-ca` を指定します。

## 関連メモ

追加予定コード:

```text
..\GAS_AUTH_TRAINING_RECORD_PATCH.md
```
