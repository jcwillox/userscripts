try:
    from mdtemplate.table.presets.userscripts import UserscriptsTableTemplate
except ImportError:
    raise ImportError("Please install md-template: pip install md-template[full]")

if __name__ == "__main__":
    UserscriptsTableTemplate().parse_args().render()
