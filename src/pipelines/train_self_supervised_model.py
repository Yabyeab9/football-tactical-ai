import torch

from src.models.self_supervised_transformer import FootballBERT
from src.pipelines.build_self_supervised_dataset import build_dataset


def train_model():

    dataset = build_dataset()

    model = FootballBERT()

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=0.0005
    )

    loss_fn = torch.nn.CrossEntropyLoss(
        ignore_index=-1
    )

    for epoch in range(30):

        total_loss = 0

        for seq, labels in dataset:

            x = torch.tensor(seq).unsqueeze(0)
            y = torch.tensor(labels).unsqueeze(0)

            pred = model(x)

            loss = loss_fn(
                pred.view(-1, pred.size(-1)),
                y.view(-1)
            )

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        print("epoch", epoch, total_loss)

    return model