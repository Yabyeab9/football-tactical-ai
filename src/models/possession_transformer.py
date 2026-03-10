import torch
import torch.nn as nn

from src.models.positional_encoding import PositionalEncoding


class PossessionTransformer(nn.Module):

    def __init__(
        self,
        vocab_size=20,
        d_model=64,
        num_heads=4,
        num_layers=2
    ):

        super().__init__()

        self.embedding = nn.Embedding(
            vocab_size,
            d_model
        )

        self.pos_encoder = PositionalEncoding(d_model)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=num_heads
        )

        self.transformer = nn.TransformerEncoder(
            encoder_layer,
            num_layers=num_layers
        )

        self.fc = nn.Linear(d_model, 1)

    def forward(self, x):

        x = self.embedding(x)

        x = self.pos_encoder(x)

        x = x.permute(1, 0, 2)

        output = self.transformer(x)

        output = output.mean(dim=0)

        return self.fc(output)