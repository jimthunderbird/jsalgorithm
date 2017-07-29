/**
 * Reference: https://leetcode.com/articles/longest-substring-without-repeating-characters/
 */
class Solution {
  lengthOfLongestSubstring(s) {
    let maxLength = 0;
    let charIndexMap = {};
    let startIndex = 0;
    let endIndex = 0;
    for (let i = 0; i < s.length; i += 1) {
      const c = s[i];

      if (charIndexMap[c] === undefined) {
        endIndex = i;
      } else {
        startIndex = charIndexMap[c] + 1;
      }

      charIndexMap[c] = i;

      const curLength = endIndex - startIndex + 1;
      if ( curLength > maxLength) {
        maxLength = curLength;
      }
    }

    return maxLength;
  }
}

const solution = new Solution();

const testStrs = ['abcabcbb','bbbbb','pwwkew','ababcde','abcdeakj','abcbd'];

testStrs.forEach( (s) => {
  console.log(solution.lengthOfLongestSubstring(s));
});
