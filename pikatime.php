<?php

class PikatimeField extends InputField {
  static public $assets = array(
    'js' => array(
      'build.js',
    ),
    'css' => array(
      'pikatime.css'
    )
  );

  public function input() {
    $input = parent::input();
    $input->data("field", "pikatime");
    $this->icon = "clock-o";
    
    if (isset($this->mode))
      $input->data("mode", $this->mode());
    else
      $input->data("mode", "24");

    return $input;
  }
}