class ChangeLightColors < ActiveRecord::Migration
  def up
    Friend.where(color: "#b0fbf8").update_all(color: "#17e1ba")
    Friend.where(color: "#b0fbb4").update_all(color: "#6ed05c")
    Friend.where(color: "#b0c4fb").update_all(color: "#91b0e6")
  end

  def down
  end
end
