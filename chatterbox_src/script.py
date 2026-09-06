
from chatterbox.models.t3.modules.t3_config import T3Config

# Patch
T3Config.multilingual = classmethod(lambda cls: cls(text_tokens_dict_size=2521))

t = T3Config.multilingual()
print(t.text_tokens_dict_size)

