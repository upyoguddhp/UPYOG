ALTER TABLE egcl_bill DROP CONSTRAINT fk_egcl_bill;
ALTER TABLE egcl_paymentdetail DROP CONSTRAINT uk_egcl_paymentdetail;

ALTER TABLE egcl_paymentdetail ADD CONSTRAINT fk_paymentdetail_bill FOREIGN KEY (billid)
REFERENCES egcl_bill(id)
ON DELETE CASCADE;