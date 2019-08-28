import React, { FormEvent, MouseEvent } from 'react';
import './App.css';
import axios from 'axios';
import ReactGA from 'react-ga';

const client = axios.create({
  baseURL: 'https://api.airtable.com/v0/appJxfRyoGTuGkiIq/Credit%20card%20info'
});

interface CreditCard {
  credit_card_name: string;
  bank: string;
  annual_fee: string;
  sign_amount: number;
  return_amount: number;
  return_ratio: number;
  annual_income: number;
  is_insurance_included: boolean;
  is_payme_included: boolean,
  is_octopus_included: boolean,
  ref: string,
}

interface CreditCardRow {
  id: string;
  fields: CreditCard[];
  createdTime: string;
}

interface CalculatedResult extends CreditCard {
  effective_spending: number;
  saved_amount: number;
}

class App extends React.Component<{}, { creditCards: CreditCard[], calculatedResults: CalculatedResult[] | undefined, inputs: { [key: string]: number} }> {
  componentDidMount() {
    if (!this.state || !this.state.creditCards) {
      this.getCreditCards();
    }
    ReactGA.initialize('UA-91087648-3');
    ReactGA.pageview('/homepage');
  }
  getCreditCards = async () => {
    try {
      const resp = await client.get<{ records: CreditCardRow[] }>('/', {
        params: {
          api_key: 'keyx3RhI4TS7m4YEx',
          view: "Grid view"
        }
      })
      this.setState({creditCards: resp.data.records.flatMap(r => r.fields)})
    } catch (err) {
      console.log(err)
    }
  }

  calculateResults = (inputs: {[key: string]: number}) => {
    const { creditCards } = this.state;
    const calculateResults: CalculatedResult[] = creditCards.map((c) => {
      const { is_insurance_included, 
              is_payme_included, 
              is_octopus_included,
              sign_amount, 
              return_amount
              } = c
      let effective_spending = 0;
      effective_spending += is_insurance_included ? inputs['insurance']: 0;
      effective_spending += is_payme_included ? inputs['epayment']: 0;
      effective_spending += is_octopus_included ? inputs['octopus']: 0;
      effective_spending += inputs['general'];
      const saved_amount = Math.floor(effective_spending / sign_amount) * return_amount;
      return { ...c, effective_spending, saved_amount }
    })
    const sorted = calculateResults.filter(c => !!c.saved_amount).sort((c1, c2) => c1.saved_amount > c2.saved_amount ? -1 : 1);
    this.setState({ calculatedResults: sorted });
  }

  onSubmitClicked = (e: FormEvent) => {
    e.preventDefault();
    const inputs = ['insurance', 'epayment', 'octopus', 'general'].reduce((acc, key) => {
      
      const val = Number((document.getElementById(key) as HTMLInputElement).value);
      acc[key] = val
      return acc;
    }, { } as { [key: string]: number})
    this.setState({inputs})
    this.calculateResults(inputs);
  }

  onLinkClicked = (c:CalculatedResult) => {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      ReactGA.event({
        category: 'Card',
        action: JSON.stringify(c),
      })
      window.location.href = c.ref;
    }
  }

  render() {
    const { calculatedResults, inputs } = !!this.state && this.state 
    return (
      <div className='container'>
        <header>
          <h1>信用卡計算器</h1>
          <h1>Credit Card Calculator</h1>
        </header>
        <main>
          <form style={ {display: `${calculatedResults ? 'none': ''}`} }>
            <p>請輸入每月支出 please enter monthly expense</p>
            <div className="form-group">
              <label htmlFor="insurance">保費 Insurance</label>
              <input type='number' className="form-control" id="insurance" aria-describedby="emailHelp" placeholder="保費 Insurance" />
            </div>
            <div className="form-group">
              <label htmlFor="epayment">電子銀包充值 E Payment</label>
              <input type="number" className="form-control" id="epayment" placeholder="電子銀包充直 E Payment" />
            </div>
            <div className="form-group">
              <label htmlFor="octopus">八達通 Octopus</label>
              <input type="number" className="form-control" id="octopus" placeholder="八達通 Octopus" />
            </div>          
            <div className="form-group">
              <label htmlFor="general">一般簽帳 General</label>
              <input type="number" className="form-control" id="general" placeholder="一般簽帳 General" />
            </div>
            <button type="submit" className="btn btn-primary" onClick={this.onSubmitClicked}>提交 Submit</button>
          </form>
          <div style={ {display: `${calculatedResults ? '': 'none'}`} }>
            {
              inputs &&
              <p>保費 Insurance: ${inputs['insurance']}, 電子銀包充值 E Payment: ${inputs['epayment']}, 八達通 Octopus: ${inputs['octopus']}, 一般簽帳 General: ${inputs['general']} </p>
            }
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">信用卡 - Credit Card</th>
                  <th scope="col">銀行 - Bank</th>
                  <th scope="col">有效簽帳 - Effective Spending</th>
                  <th scope="col">節省(每月) － Saved(per month)</th>
                </tr>
              </thead>
              <tbody>
                {
                  calculatedResults &&
                  calculatedResults.map((c, index) => {
                    return (
                      <tr>
                        <th scope="row">
                          <a href='#' onClick={this.onLinkClicked(c)}>{c.credit_card_name}</a>
                        </th>
                        <td>{c.bank}</td>
                        <td>{c.effective_spending}</td>
                        <td>{c.saved_amount}</td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
            <button type="submit" className="btn btn-primary" onClick={() => this.setState({calculatedResults: undefined})}>重設 Reset</button>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
