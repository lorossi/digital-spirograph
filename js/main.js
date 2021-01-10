/*jshint esversion: 8 */
/*jshint strict: false */
let s;

$(document).ready(() => {
    canvas = $("#sketch")[0];
    if (canvas.getContext) {
      ctx = canvas.getContext("2d", {alpha: false});
      s = new Sketch(canvas, ctx, 5, 30);
      s.run();
    }

    if (s) {
      $("#reset").click( () => {
        s.reset();
      });

      $("#play").click( () => {
        if (s) {
          s.play();
        }
      });

      $("#stop").click( () => {
        if (s) {
          s.stop();
        }
      });

      $("#duration").on("change, input", (e) => {
        let duration = $(e.target).val();
        $("#duration").next().find(".value").text(duration);
        s.duration = duration;
      });

      $("[name=color_mode]").on("change", (e) => {
        let mode = parseInt($(e.target).val()) == 0;
        $("[name=moving_colors]").prop("disabled", !mode);
        s.colors = mode;
      });

      $("[name=moving_colors]").on("change", (e) => s.moving_colors = $(e.target).prop("checked"));

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
