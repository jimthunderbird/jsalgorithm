/**
 * Reference: https://leetcode.com/articles/longest-substring-without-repeating-characters/
 */
class Solution {
  lengthOfLongestSubstring(s) {
    let maxLength = 0;
    let curLength = 0;
    let hash = {};
    for (let i = 0; i < s.length; i += 1) {

      const c = s[i];

      if (hash[c] === undefined) {
        hash[c] = 1;
        curLength += 1;
      } else {
        hash = {};
        hash[c] = 1;
        curLength = 1;
      }

      if (curLength > maxLength) {
        maxLength = curLength;
      }
    }

    return maxLength;
  }
}

const solution = new Solution();

const testStrs = ['abcabcbb','bbbbb','pwwkew','ababcde'];

testStrs.forEach( (s) => {
  console.log(solution.lengthOfLongestSubstring(s));
});
