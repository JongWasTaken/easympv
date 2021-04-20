/*
 * SHADERS.JS (MODULE)
 *
 * Author:         Jong
 * URL:            http://smto.pw/mpv
 * License:        MIT License
 */

// TODO: rewrite

var Shaders = {};
Shaders.name = "none";
Shaders.anime4k_strength;
Shaders.firsttime = true;

Shaders.apply = function (shaderset) {
  var height = mp.get_property("osd-height");
  if (height == 0) {
    height = mp.get_property("height");
  }
  var quality = "none";
  if (height <= 720) {
    quality = "SD";
  } else if (height > 720) {
    quality = "HD";
  }
  var anime4k_name = "none";
  switch (Shaders.anime4k_strength) {
    case 0:
      anime4k_name = "none";
    case 1:
      anime4k_name = "Faithful";
    case 2:
      anime4k_name = "Improved";
    case 3:
      anime4k_name = "Improved & Deblured";
    default:
      anime4k_name = "none";
  }

  // sd = 480p/720p
  // hd = 1080p
  // 0 = none
  // 1 = faithful
  // 2 = improve quality
  // 3 = improve quality and deblur
  if (shaderset == "a4k_auto_event") {
    if (Shaders.firsttime) {
      if (anime4k_name == "none") {
        Shaders.name = anime4k_name;
      } else {
        Shaders.name = quality + " Anime4K " + anime4k_name;
      }
      Shaders.apply(
        "a4k_" + quality.toLowerCase() + "_" + Shaders.anime4k_strength
      );
      Shaders.firsttime = false;
    }
  } else if (shaderset == "a4k_auto_user") {
    Shaders.name = quality + " Anime4K " + anime4k_name;
    Shaders.apply(
      "a4k_" + quality.toLowerCase() + "_" + Shaders.anime4k_strength
    );
  } else if (shaderset == "a4k_sd_1") {
    Shaders.name = "SD Anime4K Faithful";
    Shaders.anime4k_strength = 1;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/Anime4K_Upscale_CNN_L_x2_Denoise.glsl;~~/shaders/Anime4K_Auto_Downscale_Pre_x4.glsl;~~/shaders/Anime4K_Upscale_CNN_M_x2_Deblur.glsl"
    );
  } else if (shaderset == "a4k_sd_2") {
    Shaders.name = "SD Anime4K Improved";
    Shaders.anime4k_strength = 2;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/Anime4K_Upscale_CNN_L_x2_Denoise.glsl;~~/shaders/Anime4K_Auto_Downscale_Pre_x4.glsl;~~/shaders/Anime4K_DarkLines_HQ.glsl;~~/shaders/Anime4K_ThinLines_HQ.glsl;~~/shaders/Anime4K_Upscale_CNN_M_x2_Deblur.glsl"
    );
  } else if (shaderset == "a4k_sd_3") {
    Shaders.name = "SD Anime4K Improved & Deblured";
    Shaders.anime4k_strength = 3;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/Anime4K_Upscale_CNN_L_x2_Denoise.glsl;~~/shaders/Anime4K_Auto_Downscale_Pre_x4.glsl;~~/shaders/Anime4K_Deblur_DoG.glsl;~~/shaders/Anime4K_DarkLines_HQ.glsl;~~/shaders/Anime4K_ThinLines_HQ.glsl;~~/shaders/Anime4K_Upscale_CNN_M_x2_Deblur.glsl"
    );
  } else if (shaderset == "a4k_hd_1") {
    Shaders.name = "HD Anime4K Faithful";
    Shaders.anime4k_strength = 1;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/Anime4K_Denoise_Bilateral_Mode.glsl;~~/shaders/Anime4K_Upscale_CNN_M_x2_Deblur.glsl"
    );
  } else if (shaderset == "a4k_hd_2") {
    Shaders.name = "HD Anime4K Improved";
    Shaders.anime4k_strength = 2;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/Anime4K_Denoise_Bilateral_Mode.glsl;~~/shaders/Anime4K_DarkLines_HQ.glsl;~~/shaders/Anime4K_ThinLines_HQ.glsl;~~/shaders/Anime4K_Upscale_CNN_M_x2_Deblur.glsl"
    );
  } else if (shaderset == "a4k_hd_3") {
    Shaders.name = "HD Anime4K Improved & Deblured";
    Shaders.anime4k_strength = 3;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/Anime4K_Denoise_Bilateral_Mode.glsl;~~/shaders/Anime4K_Deblur_DoG.glsl;~~/shaders/Anime4K_DarkLines_HQ.glsl;~~/shaders/Anime4K_ThinLines_HQ.glsl;~~/shaders/Anime4K_Upscale_CNN_M_x2_Deblur.glsl"
    );
  } else if (shaderset == "krig") {
    Shaders.name = "KrigBilateral";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/KrigBilateral.glsl"
    );
  } else if (shaderset == "adaptivesharpen") {
    Shaders.name = "Adaptive Sharpen";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/adaptive-sharpen.glsl;~~/shaders/KrigBilateral.glsl"
    );
  } else if (shaderset == "a4k_denoise") {
    Shaders.name = "A4K Denoiser";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/Anime4K_Denoise_Heavy_CNN_L.glsl"
    );
  } else if (shaderset == "FSRCNNX16") {
    Shaders.name = "FSRCNNX (High x16)";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/FSRCNNX_x2_16-0-4-1.glsl"
    );
  } else if (shaderset == "fxaa") {
    Shaders.name = "FXAA";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv("change-list", "glsl-shaders", "set", "~~/shaders/fxaa.glsl");
  } else if (shaderset == "nnedi3_128") {
    Shaders.name = "NNEDI3 (128 Neurons)";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/nnedi3-nns128-win8x6.hook"
    );
  } else if (shaderset == "nnedi3_256") {
    Shaders.name = "NNEDI3 (256 Neurons)";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/nnedi3-nns256-win8x6.hook"
    );
  } else if (shaderset == "crt") {
    Shaders.name = "CRT";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
    mp.commandv(
      "change-list",
      "glsl-shaders",
      "set",
      "~~/shaders/crt.glsl"
    );
  } else if (
    (shaderset == "clear") |
    (shaderset == "low0") |
    (shaderset == "high0")
  ) {
    Shaders.name = "none";
    Shaders.anime4k_strength = 0;
    mp.commandv("change-list", "glsl-shaders", "clr", "");
  }
  mp.msg.info("Switching to preset: " + Shaders.name);
  try {
    Menu.rebuild();
  } catch (e) {}
};

Shaders.applyByName = function (name) {
  if (name == "none") {
  } else if (name == "SD Anime4K Faithful") {
    Shaders.apply("a4k_sd_1");
  } else if (name == "SD Anime4K Improved") {
    Shaders.apply("a4k_sd_2");
  } else if (name == "SD Anime4K Improved & Deblured") {
    Shaders.apply("a4k_sd_3");
  } else if (name == "HD Anime4K Faithful") {
    Shaders.apply("a4k_hd_1");
  } else if (name == "HD Anime4K Improved") {
    Shaders.apply("a4k_hd_2");
  } else if (name == "HD Anime4K Improved & Deblured") {
    Shaders.apply("a4k_hd_3");
  } else if (name == "KrigBilateral") {
    Shaders.apply("krig");
  } else if (name == "Adaptive Sharpen") {
    Shaders.apply("adaptivesharpen");
  } else if (name == "A4K Denoiser") {
    Shaders.apply("a4k_denoise");
  } else if (name == "FSRCNNX (High x16)") {
    Shaders.apply("FSRCNNX16");
  } else if (name == "FXAA") {
    Shaders.apply("fxaa");
  } else if (name == "NNEDI3 (128 Neurons)") {
    Shaders.apply("nnedi3_128");
  } else if (name == "NNEDI3 (256 Neurons)") {
    Shaders.apply("nnedi3_256");
  } else if (name == "CRT") {
    Shaders.apply("crt");
  } else {
  }
};

module.exports = Shaders;
