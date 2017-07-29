/**
 * Reference: https://leetcode.com/articles/longest-substring-without-repeating-characters/
 */
class Solution {
  lengthOfLongestSubstring(s) {
    let maxLength = 0;
    let charIndexMap = {};
    let startIndex = 0;
    let strLength = s.length;
    for (let i = 0; i < strLength; i += 1) {
      const c = s[i];

      if (charIndexMap[c] !== undefined) {
        startIndex = Math.max(startIndex, charIndexMap[c] + 1);
      }

      charIndexMap[c] = i;

      maxLength = Math.max(maxLength, i - startIndex + 1);
    }

    return maxLength;
  }
}

const solution = new Solution();

const testStrs = [
  'abcabcbb',
];

testStrs.forEach( (s) => {
  console.log(solution.lengthOfLongestSubstring(s));
});
