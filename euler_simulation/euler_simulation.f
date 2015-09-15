C     C-R KAIRO
      REAL I
      DIMENSION LP(101,101)
      DATA IBLANK,IV, II/' ', 'V', 'I'/
      DATA IMINUS,IPLUS,IBAR/'-','+','|'/
      DT=0.2
      DO 11 J=1,101
         DO 11 K=1,101
 11         LP(J,K)=IBLANK
            DO 12 J=1,101,10
               DO 13 K=1,101
                  LP(J,K)=IMINUS
                  LP(K,J)=IBAR
 13            CONTINUE
 12         CONTINUE
            DO 15 K=1,101,10
               DO 15 J=1,101,10
                  LP(J,K)=IPLUS
 15            CONTINUE
               C=0.000001
               R=1000000.
               V0=5.0
               V=0.0
               T=0.0
               WRITE(6,1)
 1             FORMAT('1', 6X, 'T', 9X, 'V', 9X, 'I')
               DO 10 K=1,101
                  A=1000000.*I
                  WRITE(6,2)  T,V,A
 2                FORMAT(1H ,3F10.5)
                  J1=10.0*V+1.0
                  J2=10.0*A+1.0
                  LP(J1,K)=IV
                  LP(J2,K)=II
                  I=(V0-V)/R
                  V=V+I*DT/C
                  T=T+DT
 10            CONTINUE
               WRITE(6,7)
 7             FORMAT('1')
               DO 8 KK=1,51
                  K=52-KK
                  V=FLOAT(K-1)/10.0
                  WRITE(6,6) V,(LP(K,J),J=1,101)
 6                FORMAT(' ',F5.1,2X,101A1)
 8             CONTINUE
               STOP
               END

