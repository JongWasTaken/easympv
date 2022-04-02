var MenuSystem = require("./MenuSystem");

var Wizard = {};

Wizard.idsToUnblock = [];

Wizard.Menus = {};

/*
TODO:

Add options for:

These depend on implementing a mpv.conf serializer/deserializer first
- Subtitle Language: "English" or "none", maybe more?
- Audio Language: "Japanese" or "English", maybe more?


*/

// temp
var unblock = function ()
{
    if(Wizard.idsToUnblock.length == 0) {return;}

	// Unblock quit keys
	for(i = 0; i < Wizard.idsToUnblock.length; i++)
	{
		mp.remove_key_binding(Wizard.idsToUnblock[i]);
	}
}

Wizard.Menus.Page1 = new MenuSystem.Menu(
    {
        title: "Welcome!",
        description: "Thank you for trying out easympv!@br@Since this is the first time easympv has been loaded, we will have to set a few settings.@br@You can navigate menus like this one using your mousewheel or arrow keys and enter.",
        selectedItemColor: "#77dd11",
        autoClose: 0
    },
    [
        {
            title: "Continue",
            item: "continue"
        }
    ],
    undefined
);

Wizard.Menus.Page1.eventHandler = function (event, action) 
{
    if(action == "continue")
    {
        Wizard.Menus.Page1.hideMenu();
        Wizard.Menus.Page2.showMenu();
    }
};

Wizard.Menus.Page2 = new MenuSystem.Menu(
    {
        title: "Initial Settings",
        description: "X",
        selectedItemColor: "#77dd11",
        autoClose: 0
    },
    [
        {
            title: "Performance Preset",
            item: "toggle-performance",
            description: "Laptop / integrated GPU@br@Choose this preset if you have no dedicated GPU, or you are not sure.@br@",
            data: 2
        },
        {
            title: "Continue",
            item: "continue"
        }
    ],
    undefined
);

Wizard.Menus.Page2.eventHandler = function (event, action) 
{
    if(event == "enter")
    {
        if(action == "toggle-performance")
        {
            var item = Wizard.Menus.Page2.items[0];
            if(item.data == 1)
            {
                item.description = "Laptop / integrated GPU@br@Choose this preset if you have no dedicated GPU, or you are not sure.@br@";
                item.data = 2;
            }
            else if(item.data == 2)
            {
                item.description = "Desktop / good dedicated GPU@br@Choose this preset if your PC can play videogames.@br@"
                item.data = 3;
            }
            else if(item.data == 3)
            {
                item.description = "Lowest / \"Potato\"@br@Choose this if your PC is old.@br@At this point you should probably use your phone instead."
                item.data = 1;
            }
            Wizard.Menus.Page2.redrawMenu();
        }
        else if(action == "continue")
        {
            Wizard.Menus.Page1.hideMenu();
            Wizard.Menus.Page2.showMenu();
        }
    }
};

Wizard.Start = function ()
{
    // disable all menus keys
    var bindings = JSON.parse(mp.get_property("input-bindings"));
    var keysToBlock = [];
    Wizard.idsToUnblock = [];
    for(i = 0; i < bindings.length; i++)
    {
        if(bindings[i].cmd.includes("script_binding easympv"))
        {
            keysToBlock.push(bindings[i]);
        }
    }
    for(i = 0; i < keysToBlock.length; i++)
    {
        mp.add_forced_key_binding(keysToBlock[i].key,"prevent_menu_" + i,function () {});
        Wizard.idsToUnblock.push("prevent_menu_" + i);
    }
    // open page1
    Wizard.Menus.Page1.showMenu();
}

module.exports = Wizard;