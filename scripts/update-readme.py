# /// script
# dependencies = [
#   "md-template[full]>=0.2.1",
# ]
# ///


try:
    from mdtemplate.table.presets.userscripts import UserscriptsTableTemplate
except ImportError:
    raise ImportError("Please install md-template: pip install md-template[full]")


class TableTemplate(UserscriptsTableTemplate):
    files = "src/userscripts/*/meta.yaml"


if __name__ == "__main__":
    TableTemplate().parse_args().render()
