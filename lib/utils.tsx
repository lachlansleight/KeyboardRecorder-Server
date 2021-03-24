export const semitoneToHue = (semitone: number): number => {
    semitone = semitone % 12;
    switch (semitone) {
        case 0:
            return 130;
        case 1:
            return 295;
        case 2:
            return 60;
        case 3:
            return 245;
        case 4:
            return 22;
        case 5:
            return 180;
        case 6:
            return 330;
        case 7:
            return 80;
        case 8:
            return 275;
        case 9:
            return 45;
        case 10:
            return 220;
        case 11:
            return 350;
    }
    return 0;
};

export const isBlackKey = (pitch: number): boolean => {
    const semitone = pitch % 12;
    switch (semitone) {
        case 0:
            return false;
        case 1:
            return true;
        case 2:
            return false;
        case 3:
            return true;
        case 4:
            return false;
        case 5:
            return false;
        case 6:
            return true;
        case 7:
            return false;
        case 8:
            return true;
        case 9:
            return false;
        case 10:
            return true;
        case 11:
            return false;
    }
    return false;
};
