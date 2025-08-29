defmodule QiTest do
  use ExUnit.Case
  doctest Qi

  test "greets the world" do
    assert Qi.hello() == :world
  end
end
