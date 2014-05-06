"""
Python script to test various formulas before putting them as javascript
"""

import math

def level_xp(n, first, last):
    B = math.log( last / first * 1. ) / ( n - 1 )
    A = first / ( math.exp( B ) - 1.0 )
    last_xp = 0
    for i in range(1, n+1):
        old = round( A * math.exp( B * ( i - 1 )))
        new = round( A * math.exp( B * i ))
        print 'level:', i, 'exp:', last_xp+new-old, 'diff:', new-old
        last_xp += new - old
