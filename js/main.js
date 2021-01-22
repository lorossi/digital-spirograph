/*jshint esversion: 8 */
/*jshint strict: false */
let s;
let width, height;
let capturer;

$(document).ready(() => {
  setup_capturer();

  let size = calculate_size_and_resize();
  width = $(window).width();
  height = $(window).height();

  canvas = $("#sketch")[0];
  if (canvas.getContext) {
    ctx = canvas.getContext("2d", {
      alpha: false
    });
    s = new Sketch(canvas, ctx, 60);
    s.run();
  }

  if (s) {
    $("#play").prop("disabled", !s.stopped);
    $("#stop").prop("disabled", s.stopped);

    $("[name=duration_slider]").prev().text(s.duration);
    $("[name=duration_slider]").val(s.duration);

    $("#colors[value=colors]").prop("checked", s.colors);
    $("#colors[value=bw]").prop("checked", !s.colors);

    $("#position[value=inside]").prop("checked", s.inside);
    $("#position[value=outside]").prop("checked", !s.inside);

    $("[name=moving_colors]").prop("checked", s.moving_colors);
    $("[name=moving_colors]").prop("disabled", !s.colors);

    $("[name=color_slider]").prop("disabled", s.moving_colors || !s.colors);
    $("[name=color_slider]").prev().text(s.hue);
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

    $("#reset").click(() => {
      s.reset();
      $("#play").prop("disabled", !s.stopped);
      $("#stop").prop("disabled", s.stopped);
      $("#record").prop("disabled", false);
    });

    $("#play").click(() => {
      if (s) {
        $("#play").prop("disabled", true);
        $("#stop").prop("disabled", false);
        $("#record").prop("disabled", false);
        s.play();
      }
    });

    $("#stop").click(() => {
      if (s) {
        s.stop();
        $("#stop").prop("disabled", true);
        $("#play").prop("disabled", false);
        $("#record").prop("disabled", true);
      }
    });

    $("#record").click(() => {
      if (s) {
        s.reset();
        s.startRecordind();
        $("#stop").prop("disabled", false);
        $("#play").prop("disabled", true);
        $("#record").prop("disabled", true);
      }
    });


    $("[name=duration_slider]").on("change, input", (e) => {
      let duration = $(e.target).val();
      $(e.target).prev().text(duration);
      s.duration = duration;
    });

    $("[name=position]").on("change", (e) => {
      let inside = $(e.target).val() === "inside";
      s.inside = inside;
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
      $(e.target).prev().text(hue);
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
      if (s.circles.length === 1) {
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
      $(e.target).prev().text(value);
    });
  }
});


$(window).on("resize", () => {
  if ($(window).width() != width || $(window).width() > 600) {
    size = calculate_size_and_resize();
    width = $(window).width();
    height = $(window).height();
    s.resize(width, height);
  }

  if (s) {
    s.reset();
  }
});

const calculate_size_and_resize = () => {
  let size = 0;
  for (i = size; i < Math.min($(window).width(), $(window).height()); i += 100) {
    size = i;
  }

  $("#sketch").prop("width", size);
  $("#sketch").prop("height", size);

  if (size > 480) {
    $(".form").css({
      height: size,
      width: "auto"
    });
  } else {
    $(".form").css({
      height: "auto",
      width: "auto"
    });
  }

  return size;
};

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
  new_slider += `<div class="circles_container">circle ${index + 1}`;
  new_slider += `<label>revolutions: <span class="value">${revolutions}</span><input type="range" id="${index}" parameter="revolutions" min="1" max="20" value="${revolutions}"></label>`;
  new_slider += `<label>relative radius: <span class="value">${relative_radius}</span><input type="range" id="${index}" parameter="radius" min="1" max="20" value="${relative_radius}"></label>`;
  new_slider += "</div>";
  return new_slider;
};

const setup_capturer = () => {
  capturer = new CCapture({
                           format: "gif",
                           workersPath: 'js/',
                           motionBlurFrames: 1,
                           name: `digital_spirograph`,
                           autoSaveTime: 30,
                           frameRate: 60
                          });
};
