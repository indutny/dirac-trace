'use strict';

const assert = require('assert');

const bs = require('binary-search');

function Product(multiplier, terms) {
  this.multiplier = multiplier;
  this.terms = terms;
}

Product.prototype.add = function add(value) {
  this.multiplier += value;
  return this;
};

Product.prototype.multiply = function multiply(value) {
  this.multiplier *= value;
  return this;
};

Product.prototype.addTerm = function addTerm(term) {
  let index = bs(this.terms, term, Metric.compare);
  if (index < 0)
    index = -1 - index;
  this.terms.splice(index, 0, term);
  return this;
};

Product.prototype.isMergeable = function isMergeable(other) {
  if (this.terms.length !== other.terms.length)
    return false;

  for (let i = 0; i < this.terms.length; i++)
    if (Metric.compare(this.terms[i], other.terms[i]) !== 0)
      return false;

  return true;
};

Product.prototype.toString = function toString() {
  if (this.terms.length === 0) {
    if (this.multiplier === 1)
      return '+1';
    else if (this.multiplier === -1)
      return '-1';
  }

  let r = null;
  if (this.multiplier === 1)
    r = '+';
  else if (this.multiplier === -1)
    r = '-';
  else if (this.multiplier > 0)
    r = '+' + this.multiplier;
  else
    r = this.multiplier.toString();

  for (let i = 0; i < this.terms.length; i++)
    r += (r.length === 1 ? '' : '*') + this.terms[i].toString();

  return r;
};

function Metric(left, right) {
  if (left > right) {
    const t = left;
    left = right;
    right = t;
  }

  assert(left !== right, `Ill-formed indexes ${left} and ${right}`);
  this.left = left;
  this.right = right;
}

Metric.compare = function compare(a, b) {
  if (a.left === b.left) {
    if (a.right === b.right)
      return 0;

    return a.right > b.right ? 1 : -1;
  }
  return a.left > b.left ? 1 : -1;
};

Metric.prototype.toString = function toString() {
  return `g^{${this.left},${this.right}}`;
};

function expand(indices) {
  // No matrices - just 1
  if (indices.length === 0) return [ new Product(1, []) ];

  // Odd number of matrices = 0
  if (indices.length % 2 === 1) return [];

  // Two matrices
  if (indices.length === 2)
    return [ new Product(4, [ new Metric(indices[0], indices[1]) ]) ];

  const first = indices[0];
  const child = indices.slice(2);

  const res = [];
  for (let i = 1; i < indices.length; i++) {
    const metric = new Metric(first, indices[i]);

    if (i >= 2)
      child[i - 2] = indices[i - 1];

    const sub = expand(child);
    const sign = i % 2 === 1 ? 1 : -1;
    for (let j = 0; j < sub.length; j++)
      res.push(sub[j].multiply(sign).addTerm(metric));
  }

  return res;
}
exports.expand = expand;

function filterNonZero(product) {
  return product.multiplier !== 0;
}

function merge(list) {
  const res = [];
  for (let i = 0; i < list.length; i++) {
    const product = list[i];

    let merged = false;
    for (let j = 0; j < res.length; j++) {
      if (!product.isMergeable(res[j]))
        continue;

      res[j].add(product.multiplier);
      merged = true;
      break;
    }

    if (!merged)
      res.push(product);
  }
  return res.filter(filterNonZero);
}
exports.merge = merge;

function contractOne(list, contraction) {
  const left = contraction[0];
  const right = contraction[1];

  const res = [];
  for (let i = 0; i < list.length; i++) {
    const product = list[i];
    const contracted = new Product(product.multiplier, []);
    res.push(contracted);

    const residue = [];

    for (let j = 0; j < product.terms.length; j++) {
      const term = product.terms[j];

      // Complete match
      // g_{uv} * g^{uv}
      if (term.left === left && term.right === right ||
          term.left === right && term.right === left) {
        residue.push(null, null);
        contracted.multiply(4);
        continue;
      }

      if (term.left === left || term.left === right) {
        residue.push(term.right);
        continue;
      } else if (term.right === left || term.right === right) {
        residue.push(term.left);
        continue;
      }

      contracted.addTerm(term);
    }

    assert(residue.length === 2,
           `Contraction indices not found in ${product.toString()}`);

    if (residue.length === 2 && residue[0] !== null)
      contracted.addTerm(new Metric(residue[0], residue[1]));
  }

  return merge(res);
}

function contract(list, contractions) {
  let res = list;
  for (let i = 0; i < contractions.length; i++)
    res = contractOne(res, contractions[i]);
  return res;
}
exports.contract = contract;

function stringify(list) {
  if (list.length === 0)
    return '0';

  let r = '';
  for (let i = 0; i < list.length; i++)
    r += list[i].toString();
  return r;
}
exports.stringify = stringify;
