// �݂ǂ�ȑg C79 �݂ǂ�ȑ�4��
// nCurses����Ȃ́I�p�v���O����
// 2010/12/26 amichang
// aminosan@midolina.net
//
// �Ɛӎ����F
// ��҂͂��̃v���O�������g�p���Ĕ����������Q�Ȃ�
// �g�p�҂̕s���v�ɑ΂����؂̐ӔC�𕉂�Ȃ����̂Ƃ��܂��B
//
// �g�p���@�F
// ���̃v���O�������R���p�C�����ďo�͂���
// �o�C�i���t�@�C���Ɠ����t�H���_�ɓ���̉摜�t�@�C����
// �z�u���Ă��������B
// �摜�̔z�u���I�������v���O���������s����Ύ����ōĐ�����܂��B
// �摜�t�@�C���̖��O��"nnnnn.pgm"(n�͐����̘A��)�Ƃ��Ă��������B
// �W����00001.pgm���珇�ɓǂݍ��݂܂��B
// 
// �y���Ӂz
// �Ȃ��Apgm�̃w�b�_�̃o�C�g����36�o�C�g�ɌŒ肵�Ă��邽�߁A
// �K��Irfanview���g�p����pgm���쐬���Ă��������B
// �摜������ɓǂݍ��߂Ȃ��ꍇ������܂��B
// ���̑��A�����ō쐬�������߁A�G���[������ėp��������܂���B
// �e���A�����̂�肽���悤�ɉ������Ă��������B

//��{�I�ȃ��C�u������include
#include <stdio.h>
#include <stdlib.h>

//curses.h�Ǝ��Ԋ֌W�̃��C�u������include
#include <curses.h>
#include <time.h>
#include <sys/time.h>

#define BLACK -1 //���F(16�i����FF)
#define WHITE 0 //���F
#define HEADEROFFSET 36 //�w�b�_�����̃o�C�g��
#define BUFFERSIZE 10000 //�o�b�t�@�T�C�Y�B���ɍl�����ɂ����ς��m��
#define FRAMEMAX 6570 //�t���[����
#define BLOCK 219 //CP437�Œ����`�������w������
#define WIDTH 52 //�摜�̉���(�w�b�_��ǂ܂��ɒ��ڎw�肵�Ă��܂�)
#define RATE 32500000 //�t���[���Ԃ̊Ԋu(�i�m�b�P��) 32500000�`33000000���炢���K��
#define START_FRAME 1 //�t���[���̊J�n�ԍ�

//�V�X�e�����Ԃ��擾����֐�
double getclock_usec()
{
 struct timeval tv;
    gettimeofday(&tv, NULL);
    //gettimeofday�ł́A�V�X�e�����Ԃ�
    //�����_�ȏ�ƈȉ����\���̂ɂ�蕪������Ă��܂��B
    //�߂�l�ŕԂ����ɂ���𑫂��Ă��܂��B
    //tv_usec(�����_�ȉ��̒l:�}�C�N���b�P�ʂŊi�[)��
    //1e-6(0.00001)�ł�����ƁA�������l�ɂȂ�܂��B
    //
    //��:
    //5.1�b�̏ꍇ�Atv_sec=5�Atv_usec=100000�Ƃ����l��
    //�i�[����Ă���̂ŁAtv_usec*1e-6�Ƃ��邱�ƂŁA
    //0.1�ƂȂ�Atv_sec�Ƒ����Ă���5.1�ɂȂ�B
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

	initscr();//ncurses�̏�����
	curs_set(0);//�J�[�\���̔�\��
	clear();//��ʂ̃N���A
	refresh();//���t���b�V��
	
	for(screen=START_FRAME; screen <=  FRAMEMAX; screen++){
		t1 = getclock_usec();//�`��J�n���̎��Ԃ��擾
		
		clear();//��ʃo�b�t�@�̃N���A
		sprintf(filename,"%05d.pgm\0",screen);//�t�@�C�����̐���
		fp = fopen(filename,"rb");//�t�@�C���̃I�[�v��
		
		//�t�@�C���|�C���^��null��������I������
		if(fp == NULL){
			endwin();
			return 1;
		}
		
		size = fread( buf, 1, 5000, fp );  //5000�o�C�g�ǂݍ���(���Ԃ�ǂ��Ȃ���肩��)
	
		//�t�@�C���T�C�Y�����[�v���܂킷
		//�t�@�C���w�b�_�����͔�΂��ēǂݎn�߂�
		for(i=HEADEROFFSET, row=0, col=0; i<size; ++i) 
		{	
			//��ʂ̉E�ɋ��E����`��(��������Ȃ�)
			//1�h�b�g��2�����Ȃ̂ŁA�摜������2�{�܂Ń��[�v���������A
			//�s�̍Ō�ƂȂ�B
			if(col==WIDTH*2){
				mvprintw(row,col,"|");
				col = 0;
				row++;
			}
			
			//�ǂݍ���pgm�摜�̃h�b�g�����̏ꍇ�A
			//�����`�̋L����2�o�͂���B
			//���̏ꍇ�̓X�y�[�X���o��
			if(buf[i] == BLACK) mvprintw(row,col,"%c%c",BLOCK,BLOCK);
			else if(buf[i] == WHITE) mvprintw(row,col,"  ");
			
			col=col+2;
		}
		
		
		mvprintw(row,col,"|");//���[�v�𔲂�����A�ŏI�s�ɂ����E����`��(����Ȃ�)
		
		fclose( fp )
			
		t2 = getclock_usec();//�`��I�����̎��Ԃ��擾����
		
		//�`��I�����̎��ԂƁA�J�n���̎��Ԃ��������ƂŁA
		//�`��ɂ����������Ԃ𒲂ׂ�B
		//�t���[���Ԃ̊Ԋu���Ԃɂ�����������ƂŁA
		//�`�敪�̒x�������炷�B(���S�ɂ͏����Ȃ�����;;)
		zure = (RATE-((int)((t2-t1)*1000000000)));
		delay.tv_nsec=zure;
		
		nanosleep(&delay,NULL);//�҂�
		refresh();//�o�b�t�@�̕���������ۂɕ`�悷��
	}
	
	getch();//����I�����ɏ���ɗ����Ȃ��悤�ɂ���
	endwin();//ncurses�̏I������
	
	return 0;
}
