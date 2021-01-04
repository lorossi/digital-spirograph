/*jshint esversion: 8 */
/*jshint strict: false */

$(document).ready(() => {
    canvas = $("#sketch")[0];
    if (canvas.getContext) {
      ctx = canvas.getContext("2d", {alpha: false});
      s = new Sketch(canvas, ctx);
      s.run();
    }
});

const lcm = (arr) => {
  const _gcd = (a, b) => {
    if (b == 0) return a;
    return _gcd(b, a % b);
  };

  const _lcm = (a, b) => {
    return Math.floor(a * b / _gcd(a, b));
  };

  ans = _lcm(arr[0], arr[1]);
  for (let i = 2; i < arr.length; i++) {
    ans = _lcm(ans, arr[i]);
  }
  return ans;
};

const random = (min, max, int) => {
    if (max == null && min != null) {
      max = min;
      min = 0;
    } else if (min == null && max == null) {
      min = 0;
      max = 1;
    }

   let randomNum = Math.random() * (max - min) + min;

   // return an integer value
   if (int) {
     return Math.round(randomNum);
   }

   return randomNum;
};

const map = (val, old_min, old_max, new_min, new_max) => {
  if (val > old_max) {
    val = old_max;
  } else if (val < old_min) {
    val = old_min;
  }

  return (val - old_min) * (new_max - new_min) / (old_max - old_min) + new_min;
};
