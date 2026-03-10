export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  starterCode: string;
  constraints: string[];
  edgeCases: string[];
  pattern: string;
  visualType: 'array' | 'hashmap' | 'set' | 'grid' | 'sequence';
}

export const PROBLEMS: Problem[] = [
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
    starterCode: 'function containsDuplicate(nums) {\n  \n}',
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    edgeCases: [
      'Empty array (though constraints say min 1)',
      'Array with all unique elements',
      'Array with all same elements'
    ],
    pattern: 'Hash Set / Hashing',
    visualType: 'set'
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    starterCode: 'function isAnagram(s, t) {\n  \n}',
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.'
    ],
    edgeCases: [
      'Strings of different lengths',
      'Empty strings',
      'Strings with same characters but different counts'
    ],
    pattern: 'Hash Map / Frequency Counting',
    visualType: 'hashmap'
  },
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    starterCode: 'function twoSum(nums, target) {\n  \n}',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    edgeCases: [
      'Target is sum of first two elements',
      'Target is sum of last two elements',
      'Numbers are negative',
      'Numbers are zero'
    ],
    pattern: 'Hash Map Lookup',
    visualType: 'hashmap'
  },
  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    difficulty: 'Medium',
    description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    starterCode: 'function groupAnagrams(strs) {\n  \n}',
    constraints: [
      '1 <= strs.length <= 10^4',
      '0 <= strs[i].length <= 100',
      'strs[i] consists of lowercase English letters.'
    ],
    edgeCases: [
      'Empty string in array',
      'Array with one string',
      'All strings are anagrams',
      'No strings are anagrams'
    ],
    pattern: 'Hash Map / Categorization',
    visualType: 'hashmap'
  },
  {
    id: 'top-k-frequent',
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    description: 'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.',
    starterCode: 'function topKFrequent(nums, k) {\n  \n}',
    constraints: [
      '1 <= nums.length <= 10^5',
      'k is in the range [1, the number of unique elements in the array].',
      'It is guaranteed that the answer is unique.'
    ],
    edgeCases: [
      'k equals number of unique elements',
      'All elements have same frequency',
      'Array has only one element'
    ],
    pattern: 'Heap / Bucket Sort',
    visualType: 'array'
  },
  {
    id: 'longest-consecutive',
    title: 'Longest Consecutive Sequence',
    difficulty: 'Medium',
    description: 'Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.',
    starterCode: 'function longestConsecutive(nums) {\n  \n}',
    constraints: [
      '0 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    edgeCases: [
      'Empty array',
      'Array with one element',
      'Sequence with duplicates',
      'Multiple sequences of same length'
    ],
    pattern: 'Hash Set / Sequence Building',
    visualType: 'sequence'
  }
];
