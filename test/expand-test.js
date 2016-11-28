'use strict';

const assert = require('assert');

const dirac = require('../');

describe('Dirac', () => {
  describe('.expand()', () => {
    function str(indices, expected) {
      assert.equal(dirac.stringify(dirac.expand(indices)), expected);
    }

    it('should return 1 on empty set', () => {
      str([], '+1');
    });

    it('should return 1 on odd set', () => {
      str([ 1 ], '0');
    });

    it('should return g^uv on 2-set', () => {
      str([ 'u', 'v' ], '+4*g^{u,v}');
    });

    it('should do 4-set', () => {
      str([ 'u', 'v', 'w', 'y' ],
          '+4*g^{u,v}*g^{w,y}-4*g^{u,w}*g^{v,y}+4*g^{u,y}*g^{v,w}');
    });
  });

  describe('.contract()', () => {
    function str(indices, contractions, expected) {
      const expanded = dirac.expand(indices);
      const contracted = dirac.contract(expanded, contractions);
      assert.equal(dirac.stringify(contracted), expected);
    }

    it('should contract 2-set', () => {
      str([ 'u', 'v' ], [ [ 'u', 'v' ] ], '+16');
    });

    it('should contract 4-set', () => {
      str([ 'u', 'v', 'r', 's' ], [ [ 'u', 'v' ] ], '+16*g^{r,s}');
    });
  });
});
