title: WebUSB でバーコードラベルを印刷しよう
tag: WebUSB Printer JavaScript Chrome

# はじめに

[OPENLOGI Advent Calendar 2017](https://qiita.com/advent-calendar/2017/openlogi) の5日目です。シールが好きなラベルプリンタ担当です。
みなさん、おもしろデバイスで遊んでいますか？今日はラベルプリンタとそれのページ記述言語の紹介をします。

# ラベルプリンタとは？ラベルとは？

ラベルプリンタっていうのはこういうやつです。
![CT4i direct or thermal printers will print bar code labels continuously, without pausing, even with changes in data and graphics on every label.](https://www.satoamerica.com/Uploads/Images/Products/ct4i_flat.jpg)
[ CT4i | High Volume Desktop Thermal Printer | SATO America ](https://www.satoamerica.com/products/desktop-printers/ct4i-series.aspx)

ラベルっていうのは物に貼るシールです。
<img alt="label.jpg" width="500" src="https://qiita-image-store.s3.amazonaws.com/0/4162/87343ed8-4ab6-409a-5de5-4731e08f6a3b.jpeg" />
倉庫にはたくさんの物があふれています。それらをデータと照らし合わせるには何らかの目印が必要です。このとき使うのがラベルであり、ラベルプリンタです。目印にバーコードを印刷することが多いためバーコードプリンタとも呼ばれます。倉庫で使うソフトとプリンタを連携させてバーコード化したデータを貼り付けます。

詳しくは信頼と実績のキーエンスのページをご覧ください。
[バーコードプリンタとバーコードラベル | バーコード講座 | キーエンス](https://www.keyence.co.jp/ss/products/autoid/codereader/principles_printer.jsp)

今回紹介するのは SATO 製のラベルプリンタです。このデバイスは Sato Barcode Printer Language (SBPL) というページ記述言語を解釈します。SBPL は PostScript とは違って Ghostscript 的なレンダラはなさげです。そのため SATO プリンタがないと SBPL は取っつきづらいですが純粋なデータです。適当にラップすれば簡単にバーコードなどを印刷することができます。

以下、参考情報です。

-   [HOWTO Win32 API を使用して生データをプリンタに送信する方法](https://support.microsoft.com/ja-jp/help/138594/howto-send-raw-data-to-a-printer-by-using-the-win32-api)
-   ["i" Programming Reference for MB200i, MB400i, MB410i](https://www.satoamerica.com/Uploads/Files/Datasheets/_i_%20Programming%20Reference%20for%20MB200i,%20MB400i,%20MB410i.pdf)

# ページ記述言語を手書きしてバーコードを印刷してみよう！

ところで最近は WebUSB なる実装が Google Chrome に載ったみたいですね。WebUSBはブラウザがUSBデバイスと直接命令をやりとりするための仕組みです。詳細はGoogleを参照してください。

[Access USB Devices on the Web  |  Web  |  Google Developers](https://developers.google.com/web/updates/2016/03/access-usb-devices-on-the-web)

いい機会なので USB デバイスと直にやりとりしてプリンタドライバの気持ちになってみましょう。要所にコメントを書いて説明したいと思います。 [Gist](https://gist.github.com/karronoli/1f698e47eee88e8d72fabd11dca4a287#file-webusb-ts) にも下記ソースを置いておきました。

```ts
    // webusb.ts
    enum StandardCode {
      ESC = 0x1b,
      STX = 0x02,
      ETX = 0x03,
    }

    // MB400のベンダIDとプロダクトID https://www.satoamerica.com/products/mobile-printers/mbi-series.aspx
    // このプリンタは 203dpi なのでメートルに直すと 8dot/mm
    const VID = 0x0828;
    const PID = 0x0025;

    // 各文字のアスキーコード
    const A = 'A'.charCodeAt(0);
    const B = 'B'.charCodeAt(0);
    const G = 'G'.charCodeAt(0);
    const H = 'H'.charCodeAt(0);
    const I = 'I'.charCodeAt(0);
    const Q = 'Q'.charCodeAt(0);
    const V = 'V'.charCodeAt(0);
    const Z = 'Z'.charCodeAt(0);
    const ZERO = '0'.charCodeAt(0);
    const ONE = '1'.charCodeAt(0);
    const TWO = '2'.charCodeAt(0);
    const FOUR = '4'.charCodeAt(0);
    const SIX = '6'.charCodeAt(0);
    const EIGHT = '8'.charCodeAt(0);

    let main = async function () {
      // プリンタを探してUSBの書き込み用のエンドポイントにアクセス
      const device = await navigator.usb.requestDevice(
          { filters: [{ vendorId: VID, productId: PID }] });
      await device.open();
      await device.claimInterface(0);

      return await device.transferOut(1, new Uint8Array([
        // 印刷命令開始
        StandardCode.STX, StandardCode.ESC, A,
        // 用紙のサイズは 縦400(dot)/8(dot/mm) = 50(mm)、横680(dot)/8(dot/mm) = 85(mm)
        StandardCode.ESC, A, ONE, ZERO, FOUR, ZERO, ZERO, ZERO, SIX, EIGHT, ZERO,
        // ラベルの境界はリフレクションセンサで判定する
        StandardCode.ESC, I, G, ZERO,
        // 横80(dot)/8(dot/mm) = 10(mm) に印字位置を移動
        StandardCode.ESC, H, ZERO, ZERO, EIGHT, ZERO,
        // 縦80(dot)/8(dot/mm) = 10(mm) に印字位置を移動
        StandardCode.ESC, V, ZERO, ZERO, EIGHT, ZERO,
        // CODE128で細い線を2(dot) * 1/8(mm/dot) = 0.25mm、高さ80(dot) * 1/8(mm/dot) = 10mm で 018 を印字
        StandardCode.ESC, B, G, ZERO, TWO, ZERO, EIGHT, ZERO, ZERO, ONE, EIGHT,
        // 印刷枚数を1枚
        StandardCode.ESC, Q, ZERO, ZERO, ZERO, ONE,
        // 印刷命令終了 = プリンタからラベルが出てくる
        StandardCode.ESC, Z, StandardCode.ETX]));
    };

    console.log(main());
```

これを Javascript にするにはこんな感じ。WebUSBは今のとこ独自な実装なので型定義がありません。DefinitelyTypedの定義を利用してみましょう。

    npm install @types/w3c-web-usb
    tsc -t ES2015 webusb.ts

WebUSBは実行サイトがhttpsかlocalhostに制限されています。なので適当にhttps://example.com/ を開いてコンソールにコピペ。
<img width="700" alt="スクリーンショット 2017-12-04 13.25.07.png" src="https://qiita-image-store.s3.amazonaws.com/0/4162/25b2c98a-a1f5-bc37-64be-e1043e02915e.png">

018と書かれたバーコードが出てくる。
<img alt="sato_qiita.jpg" width="400" src="https://qiita-image-store.s3.amazonaws.com/0/4162/b9a0bca8-b306-c903-cacd-45cef893ad4c.jpeg" />


WebUSB と SATO のプリンタ簡単だね！Let's Print!
