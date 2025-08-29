defmodule Pgndiv.CLI do

  def main(args) do
    args |> parse_args |> process
  end
   
  def process([]) do
    IO.puts "No arguments given"
  end
  
  def process(opts) do
    IO.puts "Parsing started #{opts[:file]}"
    Pgndiv.parse(opts[:file])
    IO.puts "Parsing finished #{opts[:file]}"
  end
  
  defp parse_args(args) do
    {options, _, _} = OptionParser.parse(args,
      switches: [file: :string]
    )
    options
  end

end
