import plugin from "tailwindcss/plugin";

const textShadowPlugin = plugin(function ({ matchUtilities, theme }) {
  matchUtilities(
    {
      "txt-shadow": (value) => ({
        textShadow: value
      })
    },
    { values: theme("txtShadow") }
  );
});

export default textShadowPlugin;
