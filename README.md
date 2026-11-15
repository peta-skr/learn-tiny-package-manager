# learn-tiny-package-manager

[g-plane/tiny-package-manager](https://github.com/g-plane/tiny-package-manager)（npmやYarn v1の仕組みを説明するための小さなパッケージマネージャ）を理解するために、TypeScriptで書き写したリポジトリ。処理の流れとファイルの分け方は元のリポジトリに沿っており、モジュール形式をESMに移している。

## できること

コードに実装されている処理は次のとおり。

- カレントディレクトリから上へ `package.json` を探し、`dependencies` と `devDependencies` を読む
- npmレジストリ（環境変数 `REGISTRY` で変更できる）からパッケージのメタデータを取得し、semverの範囲を満たす最大のバージョンを選ぶ
- 依存を再帰的にたどって解決する。循環している依存はたどらない
- バージョンが衝突しないパッケージはトップレベルの `node_modules` に置き、衝突したものは親パッケージの下の `node_modules` に置く
- tarballをダウンロードしながらそのまま展開する
- 解決結果をロックファイル `tiny-pm.yml`（YAML）に書き出し、次回はそこにある分をレジストリに問い合わせずに使う
- `install <パッケージ名>`（`-D` / `--save-dev` で devDependencies）で依存を追加し、キーを並べ替えて `package.json` を保存する。`--production` を付けると devDependencies を入れない
- 解決中のパッケージ名の表示と、インストールの進捗バー

## 動かし方

Node.js 18.17以上が必要（依存している `undici` 6の要件）。

```
npm install
npm run build      # tsc で src/ を dist/ に出力する
```

ビルド後、インストールしたいプロジェクトのディレクトリ（`package.json` があるところ）で次を実行する。`package.json` の `bin` では `tiny-pm` という名前を付けている。

```
node <このリポジトリ>/dist/cli.js install
node <このリポジトリ>/dist/cli.js install <パッケージ名>
```

テストは無い。また `src/cli.ts` は `yargs(process.argv)` と引数をそのまま渡しており、`hideBin` でnodeとスクリプトのパスを取り除いていない。元のリポジトリとは引数の受け取り方が違う。

## 構成

| ファイル | 役割 |
|---|---|
| `src/cli.ts` | コマンドライン引数の定義（yargs）。`install` と既定のコマンド |
| `src/index.ts` | 全体の流れ。`package.json` を読み、ロック読み込み→解決→ロック書き出し→インストール→`package.json` 保存 |
| `src/list.ts` | 依存ツリーの解決。置き場所（トップレベルか入れ子か）と循環の判定 |
| `src/resolve.ts` | レジストリからメタデータを取得し、メモリにキャッシュする |
| `src/install.ts` | tarballをダウンロードして `node_modules` に展開する |
| `src/lock.ts` | ロックファイル `tiny-pm.yml` の読み書き |
| `src/log.ts` | 進行状況の表示（log-update、progress） |
| `src/utils.ts` | オブジェクトのキーを並べ替える |

## 設計・実装のポイント

依存の解決方法は元のリポジトリの設計どおり。

- 処理を「解決」と「インストール」の2段階に分けている。先に依存ツリー全体を解決して、トップレベルに置くものと入れ子にするものの一覧を作り、そのあとでまとめて並列にダウンロードする
- 置き場所の決め方。初めて出てきたパッケージはトップレベルに置く。すでにトップレベルにあってその版が範囲を満たす場合は、依存のスタック上の祖先が別の版を求めていないかを調べ、求めていればその祖先の下に置く。範囲を満たさない場合は直接の親の下に置く
- 依存のスタックに同じ名前で範囲を満たすパッケージがあれば、循環とみなしてたどらない
- ロックファイルのキーは `名前@範囲`。同じ指定ならレジストリへの問い合わせを省ける
- ダウンロードしたtarballは一時ファイルに保存せず、レスポンスのストリームを `tar.extract` に直接つないで展開する

元のリポジトリから変えた点として、元は `import pm from '.'` のようにCommonJS前提で書かれているのに対し、このリポジトリは `package.json` の `"type": "module"` と `tsconfig.json` の `"module": "Node16"` でESMとして書き、相対importに `.js` を付けている。

## 学んだこと

- npm / Yarn v1型のパッケージマネージャがフラットな `node_modules` を作る手順と、バージョンが衝突したときに入れ子にする判断
- semverの範囲（`maxSatisfying`、`satisfies`）を使った依存の解決
- ロックファイルで解決結果を固定し、2回目以降の解決を省く仕組み
- TypeScriptをESM（`"module": "Node16"`）で書くときの相対importの書き方

## 参考

- g-plane/tiny-package-manager https://github.com/g-plane/tiny-package-manager
