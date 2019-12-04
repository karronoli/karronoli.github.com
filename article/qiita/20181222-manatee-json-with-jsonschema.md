title: Manatee.Json の紹介
tag: .NET F# jsonschema

JSON Schema 便利ですよね。現在の規格は draft-07 で程良く枯れてきたように感じます。これを .NET で扱うライブラリにはいくつか候補があります。そのなかでも Manatee.Json を紹介したいと思います。

- Nuget [NuGet Gallery | Manatee.Json 10.1.1](https://www.nuget.org/packages/Manatee.Json/)
- GitHub [gregsdennis/Manatee.Json: A fully object-oriented approach to JSON manipulation, validation, and serialization that focuses on modeling the JSON structure rather than mere string parsing and conversion.](https://github.com/gregsdennis/Manatee.Json)
- リファレンス [Welcome! ](https://gregsdennis.github.io/Manatee.Json/)

## 特徴
JSON 関連で大抵のことはできるだけの機能が実装されています。その中でも特筆に値するのは以下の2点です。
- `Supports JSON Schema INCLUDED AND FREE!`
- 良さげなソリューションがないから自分で書いた（意訳）

Json.Net の JSON Schema は nuget で簡単にインストールできるけど実は有料という…後から知って軽くトラブりました。有料でもいいんだけど取り回しにくい…

## 簡単に動かす例
せっかくなので F# を使ってみます。必要なファイルは [Gist](https://gist.github.com/karronoli/3b451c276f60851eef7ae48ec2d8b8ce) にも置いておきました。
まずは [dotnet-sdk](https://dotnet.microsoft.com/download) をなんらかの方法でインストールしてください。`dotnet` コマンドを使って開発環境を作りましょう。

```sh
dotnet new console -lang F# -o sample
dotnet add package Manatee.Json
```

名前と数が入っているオブジェクトです。これをバリデーションしてみます。（[item.json](https://gist.github.com/karronoli/3b451c276f60851eef7ae48ec2d8b8ce#file-item-json)）

```json
{
  "name": "ペン",
  "count": 3
}
```

対象には名前と数が必ず入っている、と JSON Schema で定義します。（[schema.json](https://gist.github.com/karronoli/3b451c276f60851eef7ae48ec2d8b8ce#file-schema-json)）

```json
{
    "$schema": "http:\/\/json-schema.org\/draft-07\/schema#",
    "type": "object",
    "properties": {
        "name": {
            "type": "string"
        },
        "count": {
            "type": "integer"
        }
    },
    "required": [
        "name",
        "count"
    ]
}
```

JSON Schema の条件に合致していたら Item クラスのインスタンスに値をセットして標準出力に表示、合っていなかったら例外を投げます。（[Program.fs](https://gist.github.com/karronoli/3b451c276f60851eef7ae48ec2d8b8ce#file-program-fs)）
バリデーションが通らなかったときのエラーメッセージは適当です。Manatee.Json ver9 に慣れてしまってるので [これ](https://gregsdennis.github.io/Manatee.Json/usage/schema.html#validation-results) を見て検討必要かも。

```fsharp
// for Manatee.Json ver10
open System
open System.IO
open System.Linq
open Manatee.Json
open Manatee.Json.Schema
open Manatee.Json.Serialization

type Item() =
    member val Name = "" with get, set
    member val Count = 0 with get, set

[<EntryPoint>]
let main argv =

    let serializer = JsonSerializer()

    let schema =
        File.ReadAllText (if argv.Length > 0 then argv.[0] else "schema.json")
        |> JsonValue.Parse
        |> serializer.Deserialize<JsonSchema>

    let json =
        File.ReadAllText (if argv.Length > 1 then argv.[1] else "item.json")
        |> JsonValue.Parse

    let result = schema.Validate json

    if not (result.IsValid)
    then
        result.AdditionalInfo.Select (fun i -> i.Key + i.Value.ToString())
        |> String.concat "\n"
        |> System.Exception
        |> raise

    printfn "Schema OK"

    let item = serializer.Deserialize<Item> json
    printfn "Name: %s, Count: %d" item.Name item.Count
    0
```

実行してみます。良さそうですね。

```
% dotnet run
Schema OK
Name: ペン, Count: 3
```

入力ファイルをいじってバリデーションを通らなくしてみます。下記は `name` を削除して実行した結果です。これも良さそうですね。

```
% dotnet run

Unhandled Exception: System.Exception: missing["name"]
   at Program.main(String[] argv) in /tmp/sample/Program.fs:line 30
```

## 落とし穴
上記の実行結果でめでたしめでたし、のように見えますよね。Json.Net に比べて知名度は高くないのにちゃんと動いた！やったー！といいたいところですが、では別の入力ファイルを用意してみましょう。

入力ファイル（[item_escaped.json](https://gist.github.com/karronoli/3b451c276f60851eef7ae48ec2d8b8ce#file-item_escaped-json)）
名前と数が入っているオブジェクト。但し、名前は Unicode エスケープされている。

```json
{
  "name": "\u30da\u30f3",
  "count": 3
}
```

実行してみるとエラー…カタカナの範囲は [U+30A0 - U+30FF](https://www.unicode.org/charts/PDF/U30A0.pdf) で文字に問題はなさそうなんですが…

```
% dotnet run schema.json item_escaped.json

Unhandled Exception: Manatee.Json.JsonSyntaxException: Invalid UTF-32 code point. Path: '/name'
   at Manatee.Json.Parsing.JsonParser.Parse(String source)
   at Program.main(String[] argv) in /tmp/sample/Program.fs:line 23
```

どうやら Unicode エスケープされた文字をアンエスケープできない場合があるようです。利用者が少ないのか、そもそも気にされていないのかは分かりませんが結構な痛手です。
では修正 PR を作るか？それとも Unicode エスケープの処理を自前で書くか？いいえ、エラーメッセージの通り JSON Schema 以前に JSON の扱いで問題が起きています。JSON を扱えるライブラリはいくつかありますよね？

プロダクトコードで Manatee.Json を使ってるところは他の JSON ライブラリを使って文字をアンエスケープして、その結果を使ってバリデーションをしています。
この記事を見て Manatee.Json を使いたいと思った人はその辺りも含めて、使うかどうかを検討してみてください。

## まとめ
- Manatee.Json いいよ
- F# 初めて書いて楽しかった（Emacs の fsharp-mode がデフォルトで十分使い易かった）
- 修正 PR 作りたいと思って早1年。とりあえず忘れないように記事化できて良かった
