// Funkciókapcsolók. Klinikai tartalom csak szakmai jóváhagyás után kapcsolható be (docs/CLINICAL-REVIEW.md).
// Ezt a fájlt NEM a felhasználó állítja: a kapcsoló a kiadás része, a teszt (tests/clinical.test.js) őrzi az alapállapotot.
export const FEATURES = Object.freeze({
  /** Elvonási tünetek kártya a krízisképernyőn. [EMBERI TEENDŐ]: addiktológus jóváhagyása kell a bekapcsoláshoz. */
  withdrawalCard: false,
});
