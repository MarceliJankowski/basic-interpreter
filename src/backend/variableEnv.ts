// PROJECT MODULES
import { Err } from "../utils";
import * as MK from "./runtimeValueFactories";

// -----------------------------------------------
//                    TYPES
// -----------------------------------------------

interface DeclareVarOptions {
  readonly position: CharPosition;
  readonly constant?: boolean;
}

/**@desc collection of variable properties*/
interface VarDescriptor {
  value: Runtime_Value;
  constant: boolean;
}

// -----------------------------------------------
//             VARIABLE ENVIRONMENT
// -----------------------------------------------

export class VariableEnv {
  private parentEnv?: VariableEnv;
  private variables: Map<string, VarDescriptor>;

  constructor(parentEnv?: VariableEnv) {
    this.parentEnv = parentEnv;
    this.variables = new Map();
  }

  // -----------------------------------------------
  //              EXTERNAL INTERFACE
  // -----------------------------------------------

  public declareVar(varName: string, value: Runtime_Value, options: DeclareVarOptions): void {
    if (this.variables.has(varName))
      throw new Err(
        `Cannot declare variable: '${varName}', as it's already defined. At position: ${options.position}`,
        "interpreter"
      );

    // declare variable
    this.variables.set(varName, { value, constant: options.constant ?? false });
  }

  /**@desc assign value to already defined variable, and return the value*/
  public assignVar(varName: string, value: Runtime_Value, position: CharPosition): Runtime_Value {
    const variable = this.resolve(varName, position);

    if (variable.constant)
      throw new Err(
        `Invalid variable assignment. Cannot assign value to a constant variable: '${varName}', at position: ${position}`,
        "interpreter"
      );

    // assign value to variable
    variable.value = value;

    return value;
  }

  /**@desc lookup `varName` variable and return it's value*/
  public lookupVar(varName: string, position: CharPosition): Runtime_Value {
    const variable = this.resolve(varName, position);
    return variable.value;
  }

  // -----------------------------------------------
  //              INTERNAL UTILITIES
  // -----------------------------------------------

  /**@desc go up the VariableEnv chain, find `varName` variable and return it */
  private resolve(varName: string, position: CharPosition): VarDescriptor {
    const variable = this.variables.get(varName);
    if (variable !== undefined) return variable;

    // if varName hasn't been found, and this is the top of VariableEnv chain, throw exception
    if (this.parentEnv === undefined)
      throw new Err(
        `Cannot resolve: '${varName}' as it does not exist. At position: ${position}`,
        "interpreter"
      );

    return this.parentEnv.resolve(varName, position);
  }
}

// -----------------------------------------------
//         GLOBAL VARIABLE ENVIRONMENT
// -----------------------------------------------

/**@desc create and populate global `variable environment`*/
export function createGlobalEnv() {
  const env = new VariableEnv();

  // GLOBAL VARIABLES
  const globalVarOptions: DeclareVarOptions = { constant: true, position: [0, 0] };

  env.declareVar("true", MK.BOOL(true), globalVarOptions);
  env.declareVar("false", MK.BOOL(false), globalVarOptions);
  env.declareVar("null", MK.NULL(), globalVarOptions);
  env.declareVar("undefined", MK.UNDEFINED(), globalVarOptions);

  return env;
}