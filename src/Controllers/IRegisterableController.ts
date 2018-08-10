import * as express from "express";

export interface IRegistrableController {
  initialize(app?: express.Application): void;
}
