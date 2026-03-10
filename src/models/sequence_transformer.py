import torch
import torch.nn as nn


class SequenceTransformer(nn.Module):

    def __init__(self, vocab=20):

        super().__init__()

        self.embedding = nn.Embedding(vocab, 64)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=64,
            nhead=4
        )

        self.transformer = nn.TransformerEncoder(
            encoder_layer,
            num_layers=3
        )

    def forward(self, seq):

        x = self.embedding(seq)

        x = x.permute(1,0,2)

        out = self.transformer(x)

        return out.mean(dim=0)