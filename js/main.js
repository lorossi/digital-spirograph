/*jshint esversion: 8 */
/*jshint strict: false */
let s;

$(document).ready(() => {
    canvas = $("#sketch")[0];
    if (canvas.getContext) {
      ctx = canvas.getContext("2d", {alpha: false});
      s = new Sketch(canvas, ctx, 30);
      s.run();
    }

    if (s) {
      $("#play").prop("disabled", !s.stopped);
      $("#stop").prop("disabled", s.stopped);

      $("[name=duration_slider]").next().text(s.duration);
      $("[name=duration_slider]").val(s.duration);

      $("#colors[value=colors]").prop("checked", s.colors);
      $("#colors[value=bw]").prop("checked", !s.colors);

      $("[name=moving_colors]").prop("checked", s.moving_colors);
      $("[name=moving_colors]").prop("disabled", !s.colors);

      $("[name=color_slider]").prop("disabled", s.moving_colors || !s.colors);
      $("[name=color_slider]").next().text(s.hue);
      $("[name=color_slider]").val(s.hue);

      $("[name=draw_circles]").prop("checked", s.draw_circles);

      $("[name=dynamic_form] #remove").prop("disabled", s.circles.length == 1);

      let circles = s.circles;
      if (circles.length > 0) {
        s.circles.forEach((p, i) => {
          let new_slider = generate_slider(i, p, s.relative_rho[i]);
          $("form[name=dynamic_form]").append(new_slider);
        });
      }

      $("#reset").click( () => {
        s.reset();
        $("#play").prop("disabled", !s.stopped);
        $("#stop").prop("disabled", s.stopped);
      });

      $("#play").click( () => {
        if (s) {
          $("#play").prop("disabled", true);
          $("#stop").prop("disabled", false);
          s.play();
        }
      });

      $("#stop").click( () => {
        if (s) {
          s.stop();
          $("#stop").prop("disabled", true);
          $("#play").prop("disabled", false);
        }
      });

      $("[name=duration_slider]").on("change, input", (e) => {
        let duration = $(e.target).val();
        $(e.target).next().text(duration);
        s.duration = duration;
      });

      $("[name=color_mode]").on("change", (e) => {
        let mode = $(e.target).val() === "colors";
        $("[name=moving_colors]").prop("disabled", !mode);
        $("[name=color_slider]").prop("disabled", !mode || s.moving_colors);

        $("[name=moving_colors]").prop("checked", s.moving_colors);
        s.colors = mode;
      });

      $("[name=moving_colors]").on("change", () => {
        let moving_colors = $("[name=moving_colors]").prop("checked");
        s.moving_colors = moving_colors;
        $("[name=color_slider]").prop("disabled", moving_colors);
      });

      $("[name=color_slider]").on("change, input", (e) => {
        let hue = parseInt($(e.target).val());
        $(e.target).next().text(hue);
        s.hue = hue;
      });

      $("[name=draw_circles]").on("change", (e) => {
        let mode = $(e.target).prop("checked");
        s.draw_circles = mode;
      });

      $("[name=dynamic_form] #add").on("click", () => {
        let revolutions = 1;
        let relative_rho = 1;
        let new_slider = generate_slider(s.circles.length, revolutions, relative_rho);
        $("form[name=dynamic_form]").append(new_slider);
        s.addCircle(revolutions, relative_rho);
        $("[name=dynamic_form] #remove").prop("disabled", false);
      });

      $("[name=dynamic_form] #remove").on("click", () => {
        $("[name=dynamic_form] .circles_container").last().remove();
        s.removeCircle();
        if (s.circles.length === 0) {
          $("[name=dynamic_form] #remove").prop("disabled", true);
        }
      });

      $("[name=dynamic_form]").on("change, input", ".circles_container input", (e) => {
        let value = parseInt($(e.target).val());
        let circle_index = parseInt($(e.target).attr("id"));
        let parameter = $(e.target).attr("parameter");

        if (parameter === "revolutions") {
          s.setRevolutions(circle_index, value);
        } else if (parameter === "radius") {
          s.setRelativeRadius(circle_index, value);
        }
        $(e.target).next().text(value);
      });
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

const generate_slider = (index, revolutions, relative_radius) => {
  let new_slider = "";
  new_slider += `<div class="circles_container">Circle ${index + 1}`;
  new_slider += `<label>revolutions <input type="range" id="${index}" parameter="revolutions" min="1" max="10" value="${revolutions}"><span class="value">${revolutions}</span></label>`;
  new_slider += `<label>relative radius <input type="range" id="${index}" parameter="radius" min="1" max="10" value="${relative_radius}"><span class="value">${relative_radius}</span></label>`;
  new_slider += "</div>";
  return new_slider;
};
