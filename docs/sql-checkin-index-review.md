# SQL化後の受付索引再評価

## 結論

スプレッドシートの「受付索引」と、Firestoreとの受付索引同期処理は、SQL受付経路では廃止候補とする。

ただし、事前申込者やイベント作成時点の対象者を固定する名簿は業務データであり、単なる高速化用索引ではない。この役割だけを `TrainingTarget` として残す。

## SQLでの役割分担

| 目的 | SQL化後の実装 |
| --- | --- |
| イベントの対象者 | `TrainingTarget`。確定した対象者名簿のみ保持 |
| 受付結果 | `Checkin` を正本とする |
| 二重受付防止 | `Checkin(trainingId, attendanceUnit, targetId)` のUNIQUE制約 |
| 受付対象か確認 | `TrainingTarget` の複合主キーで1件取得 |
| 未受付者検索 | `TrainingTarget` と `Checkin` の `NOT EXISTS` |
| 直近受付モニター | `Checkin(trainingId, checkedInAt)` INDEXで直近10件のみ取得 |
| 会社・個人検索 | `MemberCompany` と `Person` のINDEXを使用 |
| Firestore同期 | SQL受付経路では使用しない |
| 索引更新ジョブ | SQL受付経路では使用しない |

## `TrainingTarget` に持たせないもの

- 受付済みフラグ
- 受付日時
- 受付方法
- Firestore同期状態
- スプレッドシート行番号
- 集計結果

これらを対象者名簿へ複製すると、再び同期処理が必要になる。受付状態は常に `Checkin` とのJOINで判断する。

## INDEX設計

- `TrainingTarget(trainingId, targetType, targetId)`
  - 受付時の対象者1件確認
- `TrainingTarget(trainingId, targetType, branch, district, targetId)`
  - 支部・地区を指定した未受付者検索
- `Checkin(trainingId, attendanceUnit, targetId)` UNIQUE
  - 二重受付防止と既受付確認
- `Checkin(trainingId, checkedInAt)`
  - 受付モニター
- `Checkin(trainingId, memberNo, checkedInAt)`
  - 会社単位の履歴確認
- `Person(memberNo, personalId)`
  - 会社から個人を選択

## VIEWの判断

現段階では受付専用VIEWを追加しない。通常VIEWはクエリを整理する効果はあるが、結果を保持しないため、それだけで高速化するわけではない。

まず複合INDEXと `NOT EXISTS` で次を検証する。

1. 対象者1,500名で受付対象1件を取得
2. 未受付者を支部・地区指定で50件取得
3. 5人・10人同時受付
4. 受付中に直近10件モニターを更新

この検証で未受付検索だけが遅い場合に限り、DB側の受付対象VIEWを検討する。マテリアライズドVIEWは更新同期が再発するため、最初から採用しない。

## 移行時の扱い

SQL受付へ切り替わるまでは既存GAS画面が受付索引を使用しているため、現行ファイルを削除しない。受付・モニター・未受付検索・集計のSQL移行が完了した段階で、次を画面とGAS経路から外す。

- 「受付索引を更新」ボタン
- 受付索引作成ジョブ
- 受付後の受付索引更新
- Firestore受付対象・受付履歴同期
- 受付索引を前提とするリアルタイム集計

本番環境は、開発環境でSQL受付が一通り確認できるまで変更しない。
