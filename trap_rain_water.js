/**
  Given n non-negative integers representing an elevation map where the width of each bar is 1,
  compute how much water it is able to trap after raining.
  For example,
  Given [0,1,0,2,1,0,1,3,2,1,2,1], return 6.
 */

/**
 *
 * The main idea is, the storage of the water on each bar is:
 * storage = current max height - the height of the bar
 *
 * Time complexity: O(N)
 * Space Complexity: O(1)
 */

function trap(height) {
  //find the max height and its index
  let maxHeight = 0;
  let maxHeightIndex = 0;
  for (let i = 0; i < height.length; i += 1) {
    if (height[i] > maxHeight) {
      maxHeight = height[i];
      maxHeightIndex = i;
    }
  }

  let storage = 0;
  let curMaxHeight = 0;

  //look from the left to the index of max height
  for (let j = 0; j < maxHeightIndex; j += 1) {
    if (height[j] > curMaxHeight) {
      curMaxHeight = height[j];
    }
    storage += curMaxHeight - height[j];
  }

  //look from the right to the index of max height
  curMaxHeight = 0;
  for (let j = height.length - 1; j > maxHeightIndex; j -= 1) {
    if (height[j] > curMaxHeight) {
      curMaxHeight = height[j];
    }
    storage += curMaxHeight - height[j];
  }

  return storage;
}

const height = [0,1,0,2,1,0,1,3,2,1,2,1];

console.log(trap(height));
