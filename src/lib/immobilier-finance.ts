/** Pure financial rules shared by the acquisition UI and tests. */
export type AcquisitionPayment={amount:number;status:string};
export function fcfa(value:unknown):number{
 const n=Number(value);
 if(!Number.isSafeInteger(n)||n<0)throw new Error("Montant FCFA invalide");
 return n;
}
export function acquisitionBalance(price:unknown,payments:AcquisitionPayment[]):number{
 const contract=fcfa(price);
 if(contract===0)throw new Error("Prix contractuel nul");
 const confirmed=payments.filter(p=>p.status==="confirme").reduce((sum,p)=>{
  const amount=fcfa(p.amount);
  if(amount===0)throw new Error("Versement nul");
  const total=sum+amount;
  if(!Number.isSafeInteger(total))throw new Error("Dépassement de capacité numérique");
  return total;
 },0);
 if(confirmed>contract)throw new Error("Versements supérieurs au prix contractuel");
 return contract-confirmed;
}
export function canIssueFullPaymentCertificate(price:unknown,payments:AcquisitionPayment[],status:string):boolean{
 return status==="soldee"&&acquisitionBalance(price,payments)===0;
}
