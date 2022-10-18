const printLine = (text: string, breakLine: boolean = true) => {
  process.stdout.write(text + (breakLine ? "\n" : ""));
};
const promptInput = async (text: string) => {
  printLine(`\n${text}\n> `, false);
  return readLine();
};
const readLine = async () => {
  const input: string = await new Promise((resolve) =>
    process.stdin.once("data", (data) => resolve(data.toString()))
  );
  return input.trim();
};
const promptSelect = async <T extends string>(
  text: string,
  values: readonly string[]
): Promise<T> => {
  printLine(`\n${text}`);
  values.forEach((value) => {
    printLine(`- ${value}`);
  });
  printLine(`> `, false);

  const input = (await readLine()) as T;
  if (values.includes(input)) {
    return input;
  } else {
    return promptSelect(text, values);
  }
};

const nextActions = ["play again", "exit"] as const;
type NextAction = typeof nextActions[number];

const gameTitles = ["hit and blow", "janken"] as const;
type GameTitle = typeof gameTitles[number];

type GameStore = {
  [key in GameTitle]: Game;
};

abstract class Game {
  abstract setting(): Promise<void>;
  abstract play(): Promise<void>;
  abstract end(): void;
}

class GameProcedure {
  private currentGameTitle: GameTitle | "" = "";
  private currentGame: Game | null = null;

  constructor(private readonly gameStore: GameStore) {}

  public async start() {
    await this.select();
    await this.play();
  }

  private async select() {
    this.currentGameTitle = await promptSelect<GameTitle>(
      "ゲームタイトルを入力してください。",
      gameTitles
    );
    this.currentGame = this.gameStore[this.currentGameTitle];
  }

  private async play() {
    if (!this.currentGame) throw new Error("ゲームが選択されていません");

    printLine(`===\n${this.currentGameTitle}を開始します。\n===`);
    await this.currentGame.setting();
    await this.currentGame.play();
    this.currentGame.end();

    // もう一度ゲームを続けるかの処理
    const action = await promptSelect<NextAction>(
      "ゲームを続けますか？",
      nextActions
    );
    if (action === "play again") {
      await this.play();
    } else if (action === "exit") {
      this.end();
    } else {
      const neverValue: never = action;
      throw new Error(`$(neverValue) is an invalid action.`);
    }
  }

  private end() {
    printLine("ゲームを終了しました。");
    process.exit();
  }
}

const modes = ["normal", "hard", "very hard"] as const;
type Mode = typeof modes[number];

class HitAndBlow implements Game {
  private readonly answerSource = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];
  private answer: string[] = [];
  private trycount = 0;
  private mode: Mode = "normal";

  async setting() {
    // モードの設定
    // <Mode>を追加し、Mode型を返すことを明示的にする
    this.mode = await promptSelect<Mode>("モードを入力してください。", modes);
    const answerLength = this.getAnswerLength();

    // 正解の設定
    while (this.answer.length < answerLength) {
      const randNum = Math.floor(Math.random() * this.answerSource.length);
      const selectedItem = this.answerSource[randNum];
      if (!this.answer.includes(selectedItem)) {
        this.answer.push(selectedItem);
      }
    }
  }

  async play() {
    const answerLength = this.getAnswerLength();
    const inputArr = (
      await promptInput(
        `「,」区切りで${answerLength}つの数字を入力してください`
      )
    ).split(",");

    if (!this.validate(inputArr)) {
      printLine("無効な入力です");
      await this.play();
      return;
    }

    const result = this.check(inputArr);
    if (result.hit !== this.answer.length) {
      // 不正解だったら続ける
      printLine(`---\nHit: ${result.hit}\nBlow: ${result.blow}\n---`);
      this.trycount += 1;
      await this.play();
    } else {
      // 正解だったら終了
      this.trycount += 1;
    }
  }

  private check(input: string[]) {
    let hitCount = 0;
    let blowCount = 0;

    input.forEach((val, index) => {
      if (val === this.answer[index]) {
        hitCount += 1;
      } else if (this.answer.includes(val)) {
        blowCount += 1;
      }
    });
    return {
      hit: hitCount,
      blow: blowCount,
    };
  }
  private getAnswerLength() {
    switch (this.mode) {
      case "normal":
        return 3;
      case "hard":
        return 4;
      case "very hard":
        return 5;
      default:
        const neverValue: never = this.mode;
        throw new Error(`${neverValue}は無効モードです。`);
    }
  }

  end() {
    printLine(`正解です！\n試行回数: ${this.trycount}回`);
    this.reset();
  }

  private validate(inputArr: string[]) {
    const isLengthValid = inputArr.length === this.answer.length;
    const isAllAnswerSourceOption = inputArr.every((val) =>
      this.answerSource.includes(val)
    );
    const isAllDifferntValid = inputArr.every(
      (val, i) => inputArr.indexOf(val) === i
    );
    return isLengthValid && isAllAnswerSourceOption && isAllDifferntValid;
  }

  private reset() {
    this.answer = [];
    this.trycount = 0;
  }
}
class Janken implements Game {
  async setting() {}
  async play() {}
  end() {}
}

// エントリ
(async () => {
  new GameProcedure({
    "hit and blow": new HitAndBlow(),
    janken: new Janken(),
  }).start();
})();
