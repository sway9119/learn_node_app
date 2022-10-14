const printLine = (text: string, breakLine: boolean = true) => {
  process.stdout.write(text + (breakLine ? "\n" : ""));
};
const promptInput = async (text: string) => {
  printLine(`\n${text}\n> `, false);
  const input: string = await new Promise((resolve) =>
    process.stdin.once("data", (data) => resolve(data.toString()))
  );
  return input.trim();
};
type Mode = "normal" | "hard" | "very hard";

class HitAndBlow {
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
    this.mode = (await promptInput("モードを入力してください。")) as Mode;
    const answerLength = this.getAnswerLength();

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


}

