#include <bits/stdc++.h>
using namespace std;

// -------------------------------------------------
// 1. Find target element
// -------------------------------------------------

int findTarget(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] == target)
        {
            return mid;
        }
        else if (nums[mid] < target)
        {
            low = mid + 1;
        }
        else
        {
            high = mid - 1;
        }
    }

    return -1;
}

// -------------------------------------------------
// 2. First occurrence
// -------------------------------------------------

int firstOccurrence(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    int ans = -1;

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] == target)
        {
            ans = mid;
            high = mid - 1;
        }
        else if (nums[mid] < target)
        {
            low = mid + 1;
        }
        else
        {
            high = mid - 1;
        }
    }

    return ans;
}

// -------------------------------------------------
// 3. Last occurrence
// -------------------------------------------------

int lastOccurrence(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    int ans = -1;

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] == target)
        {
            ans = mid;
            low = mid + 1;
        }
        else if (nums[mid] < target)
        {
            low = mid + 1;
        }
        else
        {
            high = mid - 1;
        }
    }

    return ans;
}

// -------------------------------------------------
// 4. Frequency of target
// -------------------------------------------------

int frequency(vector<int>& nums, int target)
{
    int first = firstOccurrence(nums, target);
    int last = lastOccurrence(nums, target);

    if (first == -1)
    {
        return 0;
    }

    return last - first + 1;
}

// -------------------------------------------------
// 5. Value >= target
// -------------------------------------------------

int greaterThanEqual(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    int ans = -1;

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] >= target)
        {
            ans = nums[mid];
            high = mid - 1;
        }
        else
        {
            low = mid + 1;
        }
    }

    return ans;
}

// -------------------------------------------------
// 6. Value > target
// -------------------------------------------------

int greaterThan(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    int ans = -1;

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] > target)
        {
            ans = nums[mid];
            high = mid - 1;
        }
        else
        {
            low = mid + 1;
        }
    }

    return ans;
}

// -------------------------------------------------
// 7. Value <= target
// -------------------------------------------------

int smallerThanEqual(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    int ans = -1;

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] <= target)
        {
            ans = nums[mid];
            low = mid + 1;
        }
        else
        {
            high = mid - 1;
        }
    }

    return ans;
}

// -------------------------------------------------
// 8. Value < target
// -------------------------------------------------

int smallerThan(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    int ans = -1;

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] < target)
        {
            ans = nums[mid];
            low = mid + 1;
        }
        else
        {
            high = mid - 1;
        }
    }

    return ans;
}

// -------------------------------------------------
// 9. Nearest value to target
// -------------------------------------------------

int nearestValue(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] == target)
        {
            return nums[mid];
        }
        else if (nums[mid] < target)
        {
            low = mid + 1;
        }
        else
        {
            high = mid - 1;
        }
    }

    if (low >= nums.size())
    {
        return nums[high];
    }

    if (high < 0)
    {
        return nums[low];
    }

    if (abs(nums[low] - target) < abs(nums[high] - target))
    {
        return nums[low];
    }

    return nums[high];
}

// -------------------------------------------------
// 10. Insert position
// -------------------------------------------------

int insertPosition(vector<int>& nums, int target)
{
    int low = 0;
    int high = nums.size() - 1;

    int ans = nums.size();

    while (low <= high)
    {
        int mid = low + (high - low) / 2;

        if (nums[mid] >= target)
        {
            ans = mid;
            high = mid - 1;
        }
        else
        {
            low = mid + 1;
        }
    }

    return ans;
}

int main()
{
    vector<int> nums = {1, 2, 2, 2, 4, 5, 7, 9};

    int target = 2;

    cout << "Find Target Index : "
         << findTarget(nums, target) << endl;

    cout << "First Occurrence : "
         << firstOccurrence(nums, target) << endl;

    cout << "Last Occurrence : "
         << lastOccurrence(nums, target) << endl;

    cout << "Frequency : "
         << frequency(nums, target) << endl;

    cout << "Value >= Target : "
         << greaterThanEqual(nums, target) << endl;

    cout << "Value > Target : "
         << greaterThan(nums, target) << endl;

    cout << "Value <= Target : "
         << smallerThanEqual(nums, target) << endl;

    cout << "Value < Target : "
         << smallerThan(nums, target) << endl;

    cout << "Nearest Value : "
         << nearestValue(nums, target) << endl;

    cout << "Insert Position : "
         << insertPosition(nums, target) << endl;
}

/*

Binary Search Patterns:

1. Exact Match
   nums[mid] == target

2. First Occurrence / Lower Bound
   Move left after finding answer
   high = mid - 1

3. Last Occurrence / Upper Bound
   Move right after finding answer
   low = mid + 1

4. Insert Position
   First index where value >= target

5. Greater Than
   First value strictly > target

6. Smaller Than
   Last value strictly < target

Time Complexity:
O(log n)

Space Complexity:
O(1)

*/
