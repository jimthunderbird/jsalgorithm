/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
  let lo = 0; hi = nums.length - 1;
  let ret = -1;

  if (nums[lo] <= nums[hi]) {
    return binarySearch(nums, target, lo, hi);
  }

  for (;;) {
    mid = (lo + hi) >> 1;
    if (nums[mid] === nums[lo]) {
      //at this time, nums[mid] is the border element
      if (target < nums[0]) {
        ret = binarySearch(nums, target, mid + 1, nums.length - 1);
      } else {
        ret = binarySearch(nums, target, 0, mid);
      }
      break;
    } else if (nums[mid] > nums[lo]) {
      lo = mid;
    } else if (nums[mid] < nums[lo]) {
      hi = mid;
    }
  }
  return ret;
};

var binarySearch = function(nums, target, lo, hi) {
  let mid;
  let ret = -1;
  while (lo <= hi) { //while lo <= hi is a classical trick
    mid = (lo + hi) >> 1;
    if (nums[mid] === target) {
      ret = mid;
      break;
    } else if (nums[mid] > target) {
      hi = mid - 1; //very important, mid - 1
    } else if (nums[mid] < target) {
      lo = mid + 1; //very important, mid + 1
    }
  }
  return ret;
};

console.log(search([1],0));
