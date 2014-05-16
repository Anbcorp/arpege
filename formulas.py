"""
Python script to test various formulas before putting them as javascript
"""

import math

def level_xp(n, first, last):
    """
    Simple formula to determine how much xp is need to pass a level

    Start is 120, end is 4 million, over 50 levels

    The real deal is how many time we want this to take (as the time to kill a
    monster will be more or less predictable)
    """
    B = math.log( last / first * 1. ) / ( n - 1 )
    A = first / ( math.exp( B ) - 1.0 )
    last_xp = 0
    for i in range(1, n+1):
        old = round( A * math.exp( B * ( i - 1 )))
        new = round( A * math.exp( B * i ))
        print 'level:', i, 'exp:', last_xp+new-old, 'diff:', new-old
        last_xp += new - old

def monster_xp_ratio(level):
    """
    How many monster to kill to level to 'level'.
    Starts at 5, ends at 1200 at level 50.

    At 30sec per monster kills, level to 50 should take about 6/7 hours

    Monster xp reward is level_xp / monster_xp_ratio(level)
    """
    B = math.log( 1200/5. ) / (50 -1)
    A = 5 / (math.exp( B ) - 1.0)

    def mx(x) :
        return round(A*math.exp(B*x/1.09))

    return mx(level) - mx(level-1)

def health():

    for i in range(1,40+1):
        print 30+(i-1)*15
