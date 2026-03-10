import random


MASK_TOKEN = 99


def mask_sequence(sequence, mask_prob=0.15):

    masked_seq = sequence.copy()
    labels = [-1] * len(sequence)

    for i in range(len(sequence)):

        if random.random() < mask_prob:

            labels[i] = sequence[i]
            masked_seq[i] = MASK_TOKEN

    return masked_seq, labels