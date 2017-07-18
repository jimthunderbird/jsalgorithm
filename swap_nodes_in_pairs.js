/**
Given a linked list, swap every two adjacent nodes and return its head.

For example,
Given 1->2->3->4, you should return the list as 2->1->4->3.

Your algorithm should use only constant space. You may not modify the values in the list, only nodes itself can be changed.
 */

function ListNode (val) {
  this.val = val;
  this.next = null;
}

var swapPairs = function(head) {
  var curPair = head;
  var prevPair = null;

  while (curPair !== null && curPair.next !== null) {
    curPair = _swapPair(curPair);
    if (prevPair !== null) {
      prevPair.next.next = curPair;
    } else {
      head = curPair;
    }
    prevPair = curPair;
    curPair = curPair.next.next;
  }

  return head;
}

var _swapPair = function(pair) {
  var left = pair;
  var right = pair.next;
  left.next = right.next;
  right.next = left;
  pair = right;
  return pair;
}

var printList = function(head) {
  var current = head;
  while (current != null) {
    console.log(current.val);
    current = current.next;
  }
}

//build a singly linked list
var numbers = [1,2,3,4,5,6,7,8,9,10];
var head = null;
var current = null;
numbers.forEach((number) => {
  var node = new ListNode(number);
  if (head == null) {
    head = current = node;  
  } else {
    current.next = node;
    current = current.next; 
  }
});

head = swapPairs(head);
printList(head);
