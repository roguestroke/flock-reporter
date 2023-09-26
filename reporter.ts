import { request } from '@playwright/test';
import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

class FlockReporter implements Reporter {
  allResults: Array<{ test: TestCase; result: TestResult }>;
  startTime: number;
  webhook: string | undefined;

  async onBegin(config: FullConfig, suite: Suite) {
    this.webhook = config.reporter[0][1].flockWebHookUrl;
    this.allResults = [];
    this.startTime = this.getExactTime();
    const totalTests = suite.allTests().length;
    const { okToProceed, message } = this.preChecks();
    if (!okToProceed) {
      console.log(message);
      return;
    }
    await this.sendMessage(`**🎭** Starting the run with **${totalTests}** tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.allResults.push({ test, result });
  }

  async onEnd(result: FullResult) {
    const runResult = result.status;
    const totalPassed = this.allResults.filter((res) => res.result.status === 'passed');
    const totalFailed = this.allResults.filter((res) => res.result.status === 'failed');
    const totalTimedOut = this.allResults.filter((res) => res.result.status === 'timedOut');
    const totalSkipped = this.allResults.filter((res) => res.result.status === 'skipped');
    const totalDuration = ((this.getExactTime() - this.startTime) / 1000).toFixed(2);
    const testsDuration: string = (this.allResults[0].result.duration / 1000).toFixed(2);

    let resultText;
    if (runResult === 'passed') {
      resultText = `${runResult} *🥳*`;
    } else {
      resultText = `${runResult} *😭*`;
    }
    await this.sendMessage(`
      ===================== Run ${resultText} =====================\nTests execution time: *${testsDuration}*\nRun duration: *${totalDuration}*\n*✅ ${totalPassed.length}* | *❌ ${totalFailed.length}* | *🟡 ${totalTimedOut.length}* | *⏩ ${totalSkipped.length}*\n=====================================================
      `);
  }

  async sendMessage(message: string) {
    const context = await request.newContext({ storageState: undefined });
    let response;
    try {
      response = await context.post(`${this.webhook}`, {
        data: {
          text: message
        }
      });
    } catch (error) {
      return console.log(
        `❌ Failed to send webhook message. Ensure your webhook url is valid\nerror: ${JSON.stringify(error, null, 2)}`
      );
    }
    if (response && response.status === 200) {
      return console.log(`✅ Message sent to ${this.webhook}`);
    }
  }

  preChecks(): { okToProceed: boolean; message?: string } {
    if (this.webhook === undefined || this.webhook === ' ' || this.webhook === '') {
      return { okToProceed: false, message: '😵 Flock webhook url was not provided in the playwright config' };
    }
    return { okToProceed: true };
  }

  getExactTime(): number {
    const [seconds, nanoseconds] = process.hrtime();
    return seconds * 1000 + ((nanoseconds / 1000) | 0) / 1000;
  }
}
export default FlockReporter;
