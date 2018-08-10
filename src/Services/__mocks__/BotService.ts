import { IBotService } from "../BotService";

const MockBotService = jest.fn<IBotService>().mockImplementation(() => ({
  postMessage: jest.fn(n => "response"),
  warn: jest.fn(n => "response"),
  unwarn: jest.fn(n => "response"),
  warnings: jest.fn(n => "response"),
  report: jest.fn(n => "response"),
  help: jest.fn(n => "response"),
  info: jest.fn(n => "response"),
  register: jest.fn(n => "response"),
  kick: jest.fn(n => "response"),
  ban: jest.fn(n => "response"),
  unban: jest.fn(n => "response"),
  bans: jest.fn(n => "response"),
  op: jest.fn(n => "response"),
  deop: jest.fn(n => "response"),
  whois: jest.fn(n => "response"),
  removeMessage: jest.fn(n => "response"),
  protectTopic: jest.fn(n => "response"),
  protectPurpose: jest.fn(n => "response"),
  enforceBan: jest.fn(n => "response"),
  enforceRegistration: jest.fn(n => "response")
}));

export default MockBotService;
