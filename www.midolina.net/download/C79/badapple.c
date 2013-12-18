// みどりな組 C79 みどりな第4号
// nCurses入門なの！用プログラム
// 2010/12/26 amichang
// aminosan@midolina.net
//
// 免責事項：
// 作者はこのプログラムを使用して発生した損害など
// 使用者の不利益に対する一切の責任を負わないものとします。
//
// 使用方法：
// このプログラムをコンパイルして出力した
// バイナリファイルと同じフォルダに動画の画像ファイルを
// 配置してください。
// 画像の配置が終わったらプログラムを実行すれば自動で再生されます。
// 画像ファイルの名前は"nnnnn.pgm"(nは整数の連番)としてください。
// 標準で00001.pgmから順に読み込みます。
// 
// 【注意】
// なお、pgmのヘッダのバイト数を36バイトに固定しているため、
// 必ずIrfanviewを使用してpgmを作成してください。
// 画像が正常に読み込めない場合があります。
// その他、勢いで作成したため、エラー処理や汎用性がありません。
// 各自、自分のやりたいように改造してください。

//基本的なライブラリのinclude
#include <stdio.h>
#include <stdlib.h>

//curses.hと時間関係のライブラリのinclude
#include <curses.h>
#include <time.h>
#include <sys/time.h>

#define BLACK -1 //黒色(16進数でFF)
#define WHITE 0 //白色
#define HEADEROFFSET 36 //ヘッダ部分のバイト数
#define BUFFERSIZE 10000 //バッファサイズ。特に考えずにいっぱい確保
#define FRAMEMAX 6570 //フレーム数
#define BLOCK 219 //CP437で長方形文字を指す数字
#define WIDTH 52 //画像の横幅(ヘッダを読まずに直接指定しています)
#define RATE 32500000 //フレーム間の間隔(ナノ秒単位) 32500000～33000000くらいが適当
#define START_FRAME 1 //フレームの開始番号

//システム時間を取得する関数
double getclock_usec()
{
 struct timeval tv;
    gettimeofday(&tv, NULL);
    //gettimeofdayでは、システム時間が
    //少数点以上と以下が構造体により分離されています。
    //戻り値で返す時にそれを足してやります。
    //tv_usec(小数点以下の値:マイクロ秒単位で格納)を
    //1e-6(0.00001)でかけると、正しい値になります。
    //
    //例:
    //5.1秒の場合、tv_sec=5、tv_usec=100000という値で
    //格納されているので、tv_usec*1e-6とすることで、
    //0.1となり、tv_secと足してやると5.1になる。
    return tv.tv_sec + (double)tv.tv_usec*1e-6;
}

int main(void)
{
	FILE *fp;
	int i,row,col,screen,zure;
	int size;
	char buf[BUFFERSIZE] = "";
	char filename[100];
	char *fname;
	double t1,t2,sum;
	struct timespec delay;
	delay.tv_sec=0;

	initscr();//ncursesの初期化
	curs_set(0);//カーソルの非表示
	clear();//画面のクリア
	refresh();//リフレッシュ
	
	for(screen=START_FRAME; screen <=  FRAMEMAX; screen++){
		t1 = getclock_usec();//描画開始時の時間を取得
		
		clear();//画面バッファのクリア
		sprintf(filename,"%05d.pgm\0",screen);//ファイル名の生成
		fp = fopen(filename,"rb");//ファイルのオープン
		
		//ファイルポインタがnullだったら終了する
		if(fp == NULL){
			endwin();
			return 1;
		}
		
		size = fread( buf, 1, 5000, fp );  //5000バイト読み込む(たぶん良くないやりかた)
	
		//ファイルサイズ分ループをまわす
		//ファイルヘッダ部分は飛ばして読み始める
		for(i=HEADEROFFSET, row=0, col=0; i<size; ++i) 
		{	
			//画面の右に境界線を描く(正直いらない)
			//1ドットで2文字なので、画像横幅の2倍までループが回ったら、
			//行の最後となる。
			if(col==WIDTH*2){
				mvprintw(row,col,"|");
				col = 0;
				row++;
			}
			
			//読み込んだpgm画像のドットが黒の場合、
			//長方形の記号を2つ出力する。
			//白の場合はスペースを出力
			if(buf[i] == BLACK) mvprintw(row,col,"%c%c",BLOCK,BLOCK);
			else if(buf[i] == WHITE) mvprintw(row,col,"  ");
			
			col=col+2;
		}
		
		
		mvprintw(row,col,"|");//ループを抜けたら、最終行にも境界線を描く(いらない)
		
		fclose( fp )
			
		t2 = getclock_usec();//描画終了時の時間を取得する
		
		//描画終了時の時間と、開始時の時間を引くことで、
		//描画にかかった時間を調べる。
		//フレーム間の間隔時間にこれを引くことで、
		//描画分の遅延を減らす。(完全には消えなかった;;)
		zure = (RATE-((int)((t2-t1)*1000000000)));
		delay.tv_nsec=zure;
		
		nanosleep(&delay,NULL);//待つ
		refresh();//バッファの文字列を実際に描画する
	}
	
	getch();//動画終了時に勝手に落ちないようにする
	endwin();//ncursesの終了処理
	
	return 0;
}
